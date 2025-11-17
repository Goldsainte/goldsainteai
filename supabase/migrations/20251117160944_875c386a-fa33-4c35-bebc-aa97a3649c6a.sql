-- Concierge sessions (one per conversation thread)
CREATE TABLE IF NOT EXISTS public.concierge_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('voice', 'planner')),
  title TEXT,
  linked_trip_request_id UUID REFERENCES trip_requests(id) ON DELETE SET NULL,
  linked_storyboard_id UUID REFERENCES storyboards(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Individual messages
CREATE TABLE IF NOT EXISTS public.concierge_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES concierge_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.concierge_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concierge_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for concierge_sessions
CREATE POLICY "Users can manage their own concierge sessions"
  ON public.concierge_sessions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS policies for concierge_messages
CREATE POLICY "Users can manage their own concierge messages"
  ON public.concierge_messages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM concierge_sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM concierge_sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_concierge_sessions_user_id ON public.concierge_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_concierge_sessions_last_active ON public.concierge_sessions(last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_concierge_messages_session_id ON public.concierge_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_concierge_messages_created_at ON public.concierge_messages(created_at);