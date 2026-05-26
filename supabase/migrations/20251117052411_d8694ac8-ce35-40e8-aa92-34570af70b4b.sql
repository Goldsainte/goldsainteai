-- Add missing columns to trip_proposals for detailed proposal information
ALTER TABLE public.trip_proposals
  ADD COLUMN IF NOT EXISTS nights INTEGER,
  ADD COLUMN IF NOT EXISTS inclusions TEXT,
  ADD COLUMN IF NOT EXISTS exclusions TEXT,
  ADD COLUMN IF NOT EXISTS payment_schedule JSONB;

-- Add missing columns to storyboards for public sharing and prefill
ALTER TABLE public.storyboards
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS destination TEXT,
  ADD COLUMN IF NOT EXISTS hero_image_url TEXT,
  ADD COLUMN IF NOT EXISTS default_starts_on DATE,
  ADD COLUMN IF NOT EXISTS default_ends_on DATE,
  ADD COLUMN IF NOT EXISTS default_budget_min NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS default_budget_max NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS default_budget_level TEXT,
  ADD COLUMN IF NOT EXISTS default_pace TEXT,
  ADD COLUMN IF NOT EXISTS default_interests TEXT[];

-- CREATE INDEX IF NOT EXISTS on slug for efficient lookups
CREATE INDEX IF NOT EXISTS idx_storyboards_slug ON public.storyboards(slug);

-- Create RPC function to accept a proposal and create booking
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
  -- Get proposal details
  SELECT * INTO v_proposal
  FROM public.trip_proposals
  WHERE id = proposal_id_input;

  IF v_proposal IS NULL THEN
    RAISE EXCEPTION 'Proposal not found';
  END IF;

  -- Check if already accepted
  IF v_proposal.status = 'accepted' THEN
    -- Return existing booking if it exists
    SELECT id INTO v_booking_id
    FROM public.trip_bookings
    WHERE proposal_id = proposal_id_input
    LIMIT 1;
    
    IF v_booking_id IS NOT NULL THEN
      RETURN jsonb_build_object('booking_id', v_booking_id);
    END IF;
  END IF;

  -- Get trip request details
  SELECT * INTO v_trip_request
  FROM public.trip_requests
  WHERE id = v_proposal.trip_request_id;

  IF v_trip_request IS NULL THEN
    RAISE EXCEPTION 'Trip request not found';
  END IF;

  -- Update proposal status
  UPDATE public.trip_proposals
  SET 
    status = 'accepted',
    accepted_at = NOW()
  WHERE id = proposal_id_input;

  -- Create booking
  INSERT INTO public.trip_bookings (
    trip_request_id,
    proposal_id,
    traveler_id,
    status,
    total_amount,
    currency,
    created_at
  ) VALUES (
    v_proposal.trip_request_id,
    proposal_id_input,
    v_trip_request.user_id,
    'proposal_accepted',
    v_proposal.price_from,
    v_proposal.currency,
    NOW()
  ) RETURNING id INTO v_booking_id;

  -- Update trip request with selected proposal
  UPDATE public.trip_requests
  SET selected_proposal_id = proposal_id_input
  WHERE id = v_proposal.trip_request_id;

  RETURN jsonb_build_object('booking_id', v_booking_id);
END;
$$;
