
-- RPC for notifying mentioned users from messaging
-- Allows authenticated users to insert notifications for other users when @mentioning them in a DM conversation they're part of.

CREATE OR REPLACE FUNCTION public.notify_message_mention(
  _target_user_id uuid,
  _conversation_id uuid,
  _sender_name text,
  _excerpt text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _notification_id uuid;
  _is_participant boolean;
BEGIN
  -- Must be authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Don't allow self-notification
  IF _target_user_id = auth.uid() THEN
    RETURN NULL;
  END IF;

  -- Caller must be a participant of the referenced conversation (anti-abuse)
  SELECT EXISTS (
    SELECT 1 FROM public.dm_conversations
    WHERE id = _conversation_id
      AND (participant_1 = auth.uid() OR participant_2 = auth.uid())
  ) INTO _is_participant;

  IF NOT _is_participant THEN
    RAISE EXCEPTION 'Not a participant of this conversation';
  END IF;

  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    entity_type,
    entity_id,
    action_url,
    action_label,
    priority
  ) VALUES (
    _target_user_id,
    'mention',
    COALESCE(_sender_name, 'Someone') || ' mentioned you',
    LEFT(COALESCE(_excerpt, ''), 200),
    'dm_conversation',
    _conversation_id,
    '/messages?conversation=' || _conversation_id::text,
    'Open message',
    'normal'
  )
  RETURNING id INTO _notification_id;

  RETURN _notification_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.notify_message_mention(uuid, uuid, text, text) TO authenticated;
