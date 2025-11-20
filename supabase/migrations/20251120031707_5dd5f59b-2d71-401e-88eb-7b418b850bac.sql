-- Create trip_request_matches table for AI-ranked candidates
CREATE TABLE IF NOT EXISTS public.trip_request_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_request_id UUID NOT NULL REFERENCES public.trip_requests(id) ON DELETE CASCADE,
  candidate_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('creator','agent')) NOT NULL,
  match_score NUMERIC NOT NULL,
  reasons TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_request_matches_request
  ON public.trip_request_matches (trip_request_id);

CREATE INDEX IF NOT EXISTS idx_trip_request_matches_candidate
  ON public.trip_request_matches (candidate_profile_id);

-- Create trip_request_assignments table for primary assignee tracking
CREATE TABLE IF NOT EXISTS public.trip_request_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_request_id UUID NOT NULL REFERENCES public.trip_requests(id) ON DELETE CASCADE,
  assignee_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assignee_role TEXT CHECK (assignee_role IN ('creator','agent')) NOT NULL,
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_trip_request_assignments_unique
  ON public.trip_request_assignments (trip_request_id);

-- Enable RLS
ALTER TABLE public.trip_request_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_request_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for trip_request_matches
CREATE POLICY "Creators/agents can view their own matches"
  ON public.trip_request_matches
  FOR SELECT
  USING (
    candidate_profile_id IN (
      SELECT id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage matches"
  ON public.trip_request_matches
  FOR ALL
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role')::text = 'service_role'
  );

-- RLS policies for trip_request_assignments
CREATE POLICY "Assignees can view their assignments"
  ON public.trip_request_assignments
  FOR SELECT
  USING (
    assignee_profile_id IN (
      SELECT id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Trip owners can view assignments"
  ON public.trip_request_assignments
  FOR SELECT
  USING (
    trip_request_id IN (
      SELECT id FROM public.trip_requests WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage assignments"
  ON public.trip_request_assignments
  FOR ALL
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role')::text = 'service_role'
  );