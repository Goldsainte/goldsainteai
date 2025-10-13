-- Add notification trigger for moment interaction responses
CREATE OR REPLACE FUNCTION public.notify_moment_interaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  moment_owner_id UUID;
  responder_username TEXT;
  interaction_type_display TEXT;
BEGIN
  -- Get moment owner
  SELECT user_id INTO moment_owner_id
  FROM moments
  WHERE id = NEW.moment_id;
  
  -- Don't notify if responding to own moment
  IF moment_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get responder username
  SELECT username INTO responder_username
  FROM profiles
  WHERE id = NEW.user_id;
  
  -- Format interaction type for display
  interaction_type_display := CASE 
    WHEN NEW.interaction_type = 'poll' THEN 'voted on your poll'
    WHEN NEW.interaction_type = 'question' THEN 'answered your question'
    WHEN NEW.interaction_type = 'quiz' THEN 'took your quiz'
    WHEN NEW.interaction_type = 'slider' THEN 'rated your story'
    WHEN NEW.interaction_type = 'add_yours' THEN 'responded to your story'
    ELSE 'interacted with your story'
  END;
  
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
    'moment_interaction',
    'New Story Interaction',
    COALESCE(responder_username, 'Someone') || ' ' || interaction_type_display,
    jsonb_build_object('actor_id', NEW.user_id, 'moment_id', NEW.moment_id, 'interaction_type', NEW.interaction_type),
    '/travel-feed'
  );
  
  RETURN NEW;
END;
$function$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_notify_moment_interaction ON moment_interaction_responses;
CREATE TRIGGER trigger_notify_moment_interaction
  AFTER INSERT ON moment_interaction_responses
  FOR EACH ROW
  EXECUTE FUNCTION notify_moment_interaction();