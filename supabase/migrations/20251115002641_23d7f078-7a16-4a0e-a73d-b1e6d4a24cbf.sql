-- CREATE TABLE IF NOT EXISTS for agent-creator collaboration requests
CREATE TABLE IF NOT EXISTS public.creator_collab_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_title text NOT NULL,
  proposal_text text NOT NULL,
  compensation text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'live', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  trip_story_id uuid REFERENCES public.trip_stories(id) ON DELETE SET NULL,
  package_id uuid REFERENCES public.packaged_trips(id) ON DELETE SET NULL,
  estimated_revenue numeric DEFAULT 0,
  actual_revenue numeric DEFAULT 0,
  agent_notes text,
  creator_response text
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_creator_collab_agent_id ON public.creator_collab_requests(agent_id);
CREATE INDEX IF NOT EXISTS idx_creator_collab_creator_id ON public.creator_collab_requests(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_collab_status ON public.creator_collab_requests(status);

-- Enable RLS
ALTER TABLE public.creator_collab_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Agents can view their own collab requests"
ON public.creator_collab_requests
FOR SELECT
USING (auth.uid() = agent_id);

CREATE POLICY "Agents can insert their own collab requests"
ON public.creator_collab_requests
FOR INSERT
WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Agents can update their own collab requests"
ON public.creator_collab_requests
FOR UPDATE
USING (auth.uid() = agent_id);

CREATE POLICY "Creators can view requests sent to them"
ON public.creator_collab_requests
FOR SELECT
USING (auth.uid() = creator_id);

CREATE POLICY "Creators can update requests sent to them"
ON public.creator_collab_requests
FOR UPDATE
USING (auth.uid() = creator_id);

-- Add comment for documentation
COMMENT ON TABLE public.creator_collab_requests IS 'Tracks collaboration requests from agents to TikTok creators for creating new trip packages';
