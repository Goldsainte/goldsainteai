
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
  _stripe_payment_intent_id text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_id uuid;
  v_trip_booking_id uuid;
  v_bundle_purchase_id uuid;
  v_guide_id uuid;
BEGIN
  -- Idempotency: if we already recorded this payment, return existing row
  SELECT id INTO v_existing_id
  FROM public.bundle_purchases
  WHERE stripe_payment_intent_id = _stripe_payment_intent_id;
  IF v_existing_id IS NOT NULL THEN
    RETURN v_existing_id;
  END IF;

  -- 1. Trip booking (only if bundle is tied to a trip)
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

  -- 2. Itinerary purchases for each bundled guide
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

  -- 3. Bundle purchase row
  INSERT INTO public.bundle_purchases (
    bundle_id, buyer_id, stripe_payment_intent_id, amount_paid,
    currency, trip_booking_id, partner_payout, platform_commission
  ) VALUES (
    _bundle_id, _buyer_id, _stripe_payment_intent_id, _amount_paid,
    _currency, v_trip_booking_id, _partner_payout, _platform_commission
  )
  RETURNING id INTO v_bundle_purchase_id;

  RETURN v_bundle_purchase_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_bundle_purchase(
  uuid, uuid, uuid, uuid, uuid[], numeric, text, numeric, numeric, numeric, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_bundle_purchase(
  uuid, uuid, uuid, uuid, uuid[], numeric, text, numeric, numeric, numeric, text
) TO service_role;
