-- Add status column to trip_request_matches for accept/decline tracking
ALTER TABLE public.trip_request_matches 
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'new' 
  CHECK (status IN ('new', 'accepted', 'declined'));

-- Add index for efficient status filtering
CREATE INDEX IF NOT EXISTS idx_trip_request_matches_status 
  ON public.trip_request_matches(status);

-- Add updated_at column for tracking status changes
ALTER TABLE public.trip_request_matches 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_trip_match_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trip_match_updated_at_trigger
  BEFORE UPDATE ON public.trip_request_matches
  FOR EACH ROW
  EXECUTE FUNCTION update_trip_match_updated_at();

-- Add RLS policy for users to update their own match status
CREATE POLICY "Users can update status of their own matches"
  ON public.trip_request_matches
  FOR UPDATE
  USING (candidate_profile_id = auth.uid())
  WITH CHECK (candidate_profile_id = auth.uid());