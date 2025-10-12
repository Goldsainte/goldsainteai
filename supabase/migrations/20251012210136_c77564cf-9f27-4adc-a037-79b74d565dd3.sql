-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_notify_new_like ON public.post_likes;
DROP TRIGGER IF EXISTS trigger_notify_new_comment ON public.post_comments;
DROP TRIGGER IF EXISTS trigger_notify_new_follow ON public.user_follows;
DROP TRIGGER IF EXISTS trigger_notify_user_tag ON public.post_user_tags;
DROP TRIGGER IF EXISTS trigger_notify_collaboration_invite ON public.post_collaborators;
DROP TRIGGER IF EXISTS trigger_notify_collaboration_accepted ON public.post_collaborators;
DROP TRIGGER IF EXISTS trigger_notify_new_partnership_request ON public.brand_partnerships;
DROP TRIGGER IF EXISTS trigger_notify_partnership_status ON public.brand_partnerships;
DROP TRIGGER IF EXISTS trigger_notify_direct_message ON public.conversation_messages;

-- Recreate all triggers
-- Trigger for new likes
CREATE TRIGGER trigger_notify_new_like
  AFTER INSERT ON public.post_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_like();

-- Trigger for new comments
CREATE TRIGGER trigger_notify_new_comment
  AFTER INSERT ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_comment();

-- Trigger for new follows
CREATE TRIGGER trigger_notify_new_follow
  AFTER INSERT ON public.user_follows
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_follow();

-- Trigger for user tags
CREATE TRIGGER trigger_notify_user_tag
  AFTER INSERT ON public.post_user_tags
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_user_tag();

-- Trigger for collaboration invites
CREATE TRIGGER trigger_notify_collaboration_invite
  AFTER INSERT ON public.post_collaborators
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_collaboration_invite();

-- Trigger for collaboration acceptance
CREATE TRIGGER trigger_notify_collaboration_accepted
  AFTER UPDATE ON public.post_collaborators
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_collaboration_accepted();

-- Trigger for partnership requests
CREATE TRIGGER trigger_notify_new_partnership_request
  AFTER INSERT ON public.brand_partnerships
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_partnership_request();

-- Trigger for partnership status changes
CREATE TRIGGER trigger_notify_partnership_status
  AFTER UPDATE ON public.brand_partnerships
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_partnership_status();

-- Create function for moment (story) replies
CREATE OR REPLACE FUNCTION public.notify_moment_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  moment_owner_id UUID;
  commenter_username TEXT;
BEGIN
  -- Get moment owner
  SELECT user_id INTO moment_owner_id
  FROM moments
  WHERE id = NEW.moment_id;
  
  -- Don't notify if replying to own moment
  IF moment_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get commenter username
  SELECT username INTO commenter_username
  FROM profiles
  WHERE id = NEW.user_id;
  
  -- Create notification
  INSERT INTO notifications (
    user_id,
    notification_type,
    title,
    message,
    metadata,
    link
  ) VALUES (
    moment_owner_id,
    'moment_reply',
    'New Story Reply',
    COALESCE(commenter_username, 'Someone') || ' replied to your story',
    jsonb_build_object('actor_id', NEW.user_id, 'moment_id', NEW.moment_id),
    '/travel-feed'
  );
  
  RETURN NEW;
END;
$$;

-- Create function for direct message notifications
CREATE OR REPLACE FUNCTION public.notify_direct_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recipient_id UUID;
  sender_username TEXT;
BEGIN
  -- Get recipient from conversation
  SELECT 
    CASE 
      WHEN customer_id = NEW.sender_id THEN 
        (SELECT user_id FROM travel_agents WHERE id = agent_id)
      ELSE customer_id
    END INTO recipient_id
  FROM user_conversations
  WHERE id = NEW.conversation_id;
  
  -- Don't create notification if no recipient
  IF recipient_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get sender username
  SELECT username INTO sender_username
  FROM profiles
  WHERE id = NEW.sender_id;
  
  -- Create notification
  INSERT INTO notifications (
    user_id,
    notification_type,
    title,
    message,
    metadata,
    link
  ) VALUES (
    recipient_id,
    'direct_message',
    'New Message',
    COALESCE(sender_username, 'Someone') || ' sent you a message',
    jsonb_build_object('sender_id', NEW.sender_id, 'conversation_id', NEW.conversation_id, 'message_id', NEW.id),
    '/messages'
  );
  
  RETURN NEW;
END;
$$;

-- Trigger for direct messages
CREATE TRIGGER trigger_notify_direct_message
  AFTER INSERT ON public.conversation_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_direct_message();