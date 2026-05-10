
-- Trip context on conversations (both messaging tables)
ALTER TABLE public.dm_conversations
  ADD COLUMN IF NOT EXISTS trip_id uuid REFERENCES public.packaged_trips(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS trip_title text;

ALTER TABLE public.user_conversations
  ADD COLUMN IF NOT EXISTS trip_id uuid REFERENCES public.packaged_trips(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS trip_title text;

-- Message reactions
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.direct_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON public.message_reactions(message_id);

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own reactions" ON public.message_reactions;
CREATE POLICY "Users can manage own reactions"
  ON public.message_reactions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone in conversation can see reactions" ON public.message_reactions;
CREATE POLICY "Anyone in conversation can see reactions"
  ON public.message_reactions
  FOR SELECT
  TO authenticated
  USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
