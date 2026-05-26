-- CREATE TABLE IF NOT EXISTS to track member participation in suggestions
CREATE TABLE IF NOT EXISTS public.suggestion_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  suggestion_id UUID NOT NULL REFERENCES public.trip_suggestions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  trip_id UUID NOT NULL REFERENCES public.group_trips(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'interested' CHECK (status IN ('interested', 'confirmed', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(suggestion_id, user_id)
);

-- Enable RLS
ALTER TABLE public.suggestion_participants ENABLE ROW LEVEL SECURITY;

-- Members can view participants for trips they're part of
CREATE POLICY "Members can view suggestion participants"
  ON public.suggestion_participants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_members
      WHERE trip_members.trip_id = suggestion_participants.trip_id
        AND trip_members.user_id = auth.uid()
        AND trip_members.status = 'accepted'
    )
  );

-- Members can manage their own participation
CREATE POLICY "Members can manage own participation"
  ON public.suggestion_participants
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_suggestion_participants_suggestion ON public.suggestion_participants(suggestion_id);
CREATE INDEX IF NOT EXISTS idx_suggestion_participants_user ON public.suggestion_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_suggestion_participants_trip ON public.suggestion_participants(trip_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.suggestion_participants;
