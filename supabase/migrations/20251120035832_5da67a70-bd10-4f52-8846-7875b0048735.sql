-- Create ops view for trip bookings with full context
CREATE OR REPLACE VIEW public.trip_bookings_ops_view AS
SELECT
  b.id                      AS booking_id,
  b.trip_request_id,
  b.proposal_id,
  b.status                  AS booking_status,
  b.currency,
  b.total_price             AS amount_total_cents,
  b.platform_commission,
  b.partner_payout,
  b.stripe_payment_status   AS payment_provider,
  b.stripe_payment_intent_id AS payment_reference,
  b.payment_url,
  b.created_at              AS booking_created_at,
  b.updated_at              AS booking_updated_at,

  tr.status                 AS trip_status,
  tr.accepted_at,
  tr.destination,
  tr.start_date,
  tr.end_date,
  tr.travelers_adults,
  tr.travelers_children,
  tr.budget_min,
  tr.budget_max,
  tr.source_metadata->>'collection_title' AS collection_title,
  CASE 
    WHEN jsonb_typeof(tr.source_metadata->'tags') = 'array' 
    THEN ARRAY(SELECT jsonb_array_elements_text(tr.source_metadata->'tags'))
    ELSE NULL
  END AS collection_tags,
  tr.source_metadata->>'brand_name' AS brand_name,

  p.id                      AS brand_profile_id,
  p.avatar_url              AS brand_avatar_url

FROM public.trip_bookings b
JOIN public.trip_requests tr
  ON tr.id = b.trip_request_id
LEFT JOIN public.profiles p
  ON p.id = tr.source_brand_profile_id;

-- Admin-only RPC to update booking status
CREATE OR REPLACE FUNCTION public.admin_update_trip_booking_status(
  p_booking_id UUID,
  p_new_status TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trip_id UUID;
BEGIN
  -- CRITICAL: Enforce admin-only access
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role = 'admin'::app_role
  ) THEN
    RAISE EXCEPTION 'Not authorized: admin role required';
  END IF;

  -- Update booking status
  UPDATE public.trip_bookings
  SET status = p_new_status::text,
      updated_at = now()
  WHERE id = p_booking_id
  RETURNING trip_request_id INTO v_trip_id;

  IF v_trip_id IS NULL THEN
    RAISE EXCEPTION 'Booking not found: %', p_booking_id;
  END IF;

  -- When booking is paid out, mark trip as completed
  IF p_new_status = 'paid_out' THEN
    UPDATE public.trip_requests
    SET status = 'completed',
        updated_at = now()
    WHERE id = v_trip_id;
  END IF;
END;
$$;

-- Lock down permissions
REVOKE ALL ON FUNCTION public.admin_update_trip_booking_status(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_trip_booking_status(UUID, TEXT) TO authenticated;