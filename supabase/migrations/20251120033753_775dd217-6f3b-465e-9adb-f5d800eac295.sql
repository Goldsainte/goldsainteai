-- Add accepted proposal tracking to trip_requests
ALTER TABLE public.trip_requests
  ADD COLUMN accepted_proposal_id UUID REFERENCES public.trip_proposals(id) ON DELETE SET NULL;

ALTER TABLE public.trip_requests
  ADD COLUMN accepted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_trip_requests_accepted_proposal 
  ON public.trip_requests(accepted_proposal_id);
