
-- =========================================================================
-- M1: Atomic track-view (single transaction: dedup + increment)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.track_view_atomic(
  _kind text,
  _entity_id uuid,
  _ip_hash text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  IF _kind NOT IN ('trip','product') THEN
    RAISE EXCEPTION 'invalid kind: %', _kind;
  END IF;

  INSERT INTO public.view_dedup (ip_hash, kind, entity_id)
  VALUES (_ip_hash, _kind, _entity_id)
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count = 0 THEN
    RETURN false; -- already counted today
  END IF;

  IF _kind = 'trip' THEN
    PERFORM public.increment_trip_view(_trip_id := _entity_id);
  ELSE
    PERFORM public.increment_product_view(_product_id := _entity_id);
  END IF;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.track_view_atomic(text, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.track_view_atomic(text, uuid, text) TO service_role;

-- =========================================================================
-- M2: Username history + 30-day cooldown
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.username_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  old_username text,
  new_username text,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_username_history_user
  ON public.username_history (user_id, changed_at DESC);

ALTER TABLE public.username_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own username history"
ON public.username_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins view all username history"
ON public.username_history FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- BEFORE trigger: enforce 30-day cooldown when a non-null username changes
CREATE OR REPLACE FUNCTION public.enforce_username_change_cooldown()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_change timestamptz;
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.username IS DISTINCT FROM OLD.username
     AND OLD.username IS NOT NULL
     AND NEW.username IS NOT NULL THEN
    SELECT MAX(changed_at) INTO v_last_change
    FROM public.username_history
    WHERE user_id = NEW.id;

    IF v_last_change IS NOT NULL AND v_last_change > now() - INTERVAL '30 days' THEN
      RAISE EXCEPTION
        'Username can only be changed once every 30 days. Try again after %',
        (v_last_change + INTERVAL '30 days')::date
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_username_cooldown ON public.profiles;
CREATE TRIGGER profiles_username_cooldown
BEFORE UPDATE OF username ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_username_change_cooldown();

-- AFTER trigger: log every username change
CREATE OR REPLACE FUNCTION public.log_username_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.username IS DISTINCT FROM OLD.username THEN
    INSERT INTO public.username_history (user_id, old_username, new_username)
    VALUES (NEW.id, OLD.username, NEW.username);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_username_history ON public.profiles;
CREATE TRIGGER profiles_username_history
AFTER UPDATE OF username ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.log_username_change();

-- =========================================================================
-- M5: create_bundle_purchase reports was_new so webhook can skip duplicate emails
-- =========================================================================
DROP FUNCTION IF EXISTS public.create_bundle_purchase(
  uuid, uuid, uuid, uuid, uuid[], numeric, text, numeric, numeric, numeric, text
);

CREATE OR REPLACE FUNCTION public.create_bundle_purchase(
  _bundle_id uuid,
  _buyer_id uuid,
  _creator_id uuid,
  _trip_id uuid,
  _guide_ids uuid[],
  _amount_paid numeric,
  _currency text,
  _platform_commission numeric,
  _partner_payout numeric,
  _commission_pct numeric,
  _stripe_payment_intent_id text,
  OUT purchase_id uuid,
  OUT was_new boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_id uuid;
  v_trip_booking_id uuid;
  v_guide_id uuid;
BEGIN
  SELECT id INTO v_existing_id
  FROM public.bundle_purchases
  WHERE stripe_payment_intent_id = _stripe_payment_intent_id;
  IF v_existing_id IS NOT NULL THEN
    purchase_id := v_existing_id;
    was_new := false;
    RETURN;
  END IF;

  IF _trip_id IS NOT NULL THEN
    INSERT INTO public.trip_bookings (
      traveler_id, partner_id, partner_role, total_price, currency,
      status, partner_payout, platform_commission,
      stripe_payment_intent_id, metadata
    ) VALUES (
      _buyer_id, _creator_id, 'creator', _amount_paid, _currency,
      'confirmed', _partner_payout, _platform_commission,
      _stripe_payment_intent_id,
      jsonb_build_object(
        'source', 'bundle_purchase',
        'bundle_id', _bundle_id,
        'trip_id', _trip_id,
        'commission_pct', _commission_pct
      )
    )
    RETURNING id INTO v_trip_booking_id;
  END IF;

  IF _guide_ids IS NOT NULL THEN
    FOREACH v_guide_id IN ARRAY _guide_ids LOOP
      INSERT INTO public.itinerary_purchases (
        buyer_id, product_id, stripe_payment_intent_id, amount_paid, currency
      ) VALUES (
        _buyer_id, v_guide_id,
        _stripe_payment_intent_id || ':' || v_guide_id::text,
        0, _currency
      )
      ON CONFLICT (stripe_payment_intent_id) DO NOTHING;
    END LOOP;
  END IF;

  INSERT INTO public.bundle_purchases (
    bundle_id, buyer_id, stripe_payment_intent_id, amount_paid,
    currency, trip_booking_id, partner_payout, platform_commission
  ) VALUES (
    _bundle_id, _buyer_id, _stripe_payment_intent_id, _amount_paid,
    _currency, v_trip_booking_id, _partner_payout, _platform_commission
  )
  RETURNING id INTO purchase_id;

  was_new := true;
END;
$$;

REVOKE ALL ON FUNCTION public.create_bundle_purchase(
  uuid, uuid, uuid, uuid, uuid[], numeric, text, numeric, numeric, numeric, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_bundle_purchase(
  uuid, uuid, uuid, uuid, uuid[], numeric, text, numeric, numeric, numeric, text
) TO service_role;
