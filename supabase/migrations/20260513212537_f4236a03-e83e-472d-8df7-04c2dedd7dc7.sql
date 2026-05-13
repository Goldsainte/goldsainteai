-- Harden accept_proposal_rpc with row-level lock to prevent concurrent acceptance
CREATE OR REPLACE FUNCTION public.accept_proposal_rpc(proposal_id_input UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_proposal RECORD;
  v_trip_request RECORD;
  v_booking_id UUID;
BEGIN
  -- Lock proposal row to prevent concurrent acceptance
  SELECT * INTO v_proposal
  FROM public.trip_proposals
  WHERE id = proposal_id_input
  FOR UPDATE;

  IF v_proposal IS NULL THEN
    RAISE EXCEPTION 'Proposal not found';
  END IF;

  -- If already accepted, return existing booking idempotently
  IF v_proposal.status = 'accepted' THEN
    SELECT id INTO v_booking_id
    FROM public.trip_bookings
    WHERE proposal_id = proposal_id_input
    LIMIT 1;
    IF v_booking_id IS NOT NULL THEN
      RETURN jsonb_build_object('booking_id', v_booking_id);
    END IF;
  END IF;

  -- Lock trip request row as well, to prevent two proposals being accepted on same trip
  SELECT * INTO v_trip_request
  FROM public.trip_requests
  WHERE id = v_proposal.trip_request_id
  FOR UPDATE;

  IF v_trip_request IS NULL THEN
    RAISE EXCEPTION 'Trip request not found';
  END IF;

  -- If trip already has a different selected proposal, reject
  IF v_trip_request.selected_proposal_id IS NOT NULL
     AND v_trip_request.selected_proposal_id <> proposal_id_input THEN
    RAISE EXCEPTION 'Another proposal has already been accepted for this trip';
  END IF;

  UPDATE public.trip_proposals
  SET status = 'accepted',
      accepted_at = NOW()
  WHERE id = proposal_id_input;

  INSERT INTO public.trip_bookings (
    trip_request_id, proposal_id, traveler_id, status,
    total_amount, currency, created_at
  ) VALUES (
    v_proposal.trip_request_id,
    proposal_id_input,
    v_trip_request.user_id,
    'proposal_accepted',
    v_proposal.price_from,
    v_proposal.currency,
    NOW()
  ) RETURNING id INTO v_booking_id;

  UPDATE public.trip_requests
  SET selected_proposal_id = proposal_id_input
  WHERE id = v_proposal.trip_request_id;

  RETURN jsonb_build_object('booking_id', v_booking_id);
END;
$$;