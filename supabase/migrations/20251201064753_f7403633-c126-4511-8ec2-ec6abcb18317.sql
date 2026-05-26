-- Create dm_conversations table for conversation threads
CREATE TABLE IF NOT EXISTS public.dm_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  participant_2 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'request' CHECK (status IN ('request', 'active', 'archived', 'declined', 'blocked')),
  initiated_by UUID NOT NULL REFERENCES public.profiles(id),
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  unread_count_p1 INTEGER DEFAULT 0,
  unread_count_p2 INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_conversation UNIQUE (participant_1, participant_2),
  CONSTRAINT different_participants CHECK (participant_1 <> participant_2)
);

-- Create direct_messages table
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.dm_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT FALSE,
  flagged_for_review BOOLEAN DEFAULT FALSE,
  flagged_reason TEXT,
  filtered_content TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create message_settings table for privacy controls
CREATE TABLE IF NOT EXISTS public.message_settings (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  who_can_message TEXT DEFAULT 'everyone' CHECK (who_can_message IN ('everyone', 'verified_only', 'nobody')),
  filter_requests BOOLEAN DEFAULT TRUE,
  show_read_receipts BOOLEAN DEFAULT TRUE,
  allow_message_requests BOOLEAN DEFAULT TRUE,
  blocked_users UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_dm_conversations_participant_1 ON public.dm_conversations(participant_1);
CREATE INDEX IF NOT EXISTS idx_dm_conversations_participant_2 ON public.dm_conversations(participant_2);
CREATE INDEX IF NOT EXISTS idx_dm_conversations_status ON public.dm_conversations(status);
CREATE INDEX IF NOT EXISTS idx_dm_conversations_last_message ON public.dm_conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation ON public.direct_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON public.direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created ON public.direct_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_unread ON public.direct_messages(conversation_id, is_read) WHERE is_read = FALSE;

-- Enable RLS
ALTER TABLE public.dm_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for dm_conversations
CREATE POLICY "Users can view their conversations"
  ON public.dm_conversations FOR SELECT
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Users can create conversations"
  ON public.dm_conversations FOR INSERT
  WITH CHECK (auth.uid() = initiated_by AND (auth.uid() = participant_1 OR auth.uid() = participant_2));

CREATE POLICY "Users can update their conversations"
  ON public.dm_conversations FOR UPDATE
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- RLS policies for direct_messages
CREATE POLICY "Users can view messages in their conversations"
  ON public.direct_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.dm_conversations c
      WHERE c.id = conversation_id
      AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    )
  );

CREATE POLICY "Users can send messages"
  ON public.direct_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.dm_conversations c
      WHERE c.id = conversation_id
      AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    )
  );

CREATE POLICY "Users can update their own messages"
  ON public.direct_messages FOR UPDATE
  USING (sender_id = auth.uid());

-- RLS policies for message_settings
CREATE POLICY "Users can view their own settings"
  ON public.message_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON public.message_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON public.message_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dm_conversations;

-- Trigger to update updated_at
CREATE TRIGGER update_dm_conversations_updated_at
  BEFORE UPDATE ON public.dm_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_message_settings_updated_at
  BEFORE UPDATE ON public.message_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
