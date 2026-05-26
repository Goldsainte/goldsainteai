-- Create trip_messages table for chat
CREATE TABLE IF NOT EXISTS public.trip_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.group_trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  parent_message_id UUID REFERENCES public.trip_messages(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trip_messages ENABLE ROW LEVEL SECURITY;

-- Members can view messages for trips they're part of
CREATE POLICY "Members can view trip messages"
  ON public.trip_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_members
      WHERE trip_members.trip_id = trip_messages.trip_id
        AND trip_members.user_id = auth.uid()
        AND trip_members.status = 'accepted'
    )
  );

-- Members can send messages to trips they're part of
CREATE POLICY "Members can send trip messages"
  ON public.trip_messages
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.trip_members
      WHERE trip_members.trip_id = trip_messages.trip_id
        AND trip_members.user_id = auth.uid()
        AND trip_members.status = 'accepted'
    )
  );

-- Users can delete their own messages
CREATE POLICY "Users can delete own messages"
  ON public.trip_messages
  FOR DELETE
  USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trip_messages_trip_id ON public.trip_messages(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_messages_parent_id ON public.trip_messages(parent_message_id);
CREATE INDEX IF NOT EXISTS idx_trip_messages_created_at ON public.trip_messages(created_at DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_messages;
