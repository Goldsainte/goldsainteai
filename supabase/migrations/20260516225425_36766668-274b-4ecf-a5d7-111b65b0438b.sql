-- Add missing RLS policies on conversation_messages so participants can read/insert/delete
-- their messages. Without these, realtime subscriptions on this table return nothing.

CREATE POLICY "Conversation participants can view messages"
ON public.conversation_messages
FOR SELECT
USING (
  conversation_id IN (
    SELECT id FROM public.user_conversations
    WHERE customer_id = auth.uid() OR agent_id = auth.uid()
  )
);

CREATE POLICY "Conversation participants can send messages"
ON public.conversation_messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND conversation_id IN (
    SELECT id FROM public.user_conversations
    WHERE customer_id = auth.uid() OR agent_id = auth.uid()
  )
);

CREATE POLICY "Senders can delete their own messages"
ON public.conversation_messages
FOR DELETE
USING (sender_id = auth.uid());