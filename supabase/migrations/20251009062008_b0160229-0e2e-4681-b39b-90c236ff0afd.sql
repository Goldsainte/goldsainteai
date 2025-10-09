-- Update notification triggers to work with existing schema

-- Function to notify on new comment
CREATE OR REPLACE FUNCTION notify_new_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_owner_id UUID;
  commenter_username TEXT;
BEGIN
  -- Get post owner
  SELECT user_id INTO post_owner_id
  FROM travel_posts
  WHERE id = NEW.post_id;
  
  -- Don't notify if commenting on own post
  IF post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get commenter username
  SELECT username INTO commenter_username
  FROM profiles
  WHERE id = NEW.user_id;
  
  -- Create notification using existing schema
  INSERT INTO notifications (
    user_id, 
    notification_type, 
    title, 
    message, 
    metadata,
    link
  )
  VALUES (
    post_owner_id,
    'comment',
    'New Comment',
    COALESCE(commenter_username, 'Someone') || ' commented on your post',
    jsonb_build_object(
      'actor_id', NEW.user_id,
      'post_id', NEW.post_id,
      'comment_id', NEW.id
    ),
    '/travel-feed'
  );
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_new_comment ON public.post_comments;
CREATE TRIGGER trigger_notify_new_comment
  AFTER INSERT ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_comment();

-- Function to notify on new like
CREATE OR REPLACE FUNCTION notify_new_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_owner_id UUID;
  liker_username TEXT;
BEGIN
  -- Get post owner
  SELECT user_id INTO post_owner_id
  FROM travel_posts
  WHERE id = NEW.post_id;
  
  -- Don't notify if liking own post
  IF post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get liker username
  SELECT username INTO liker_username
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
  )
  VALUES (
    post_owner_id,
    'like',
    'New Like',
    COALESCE(liker_username, 'Someone') || ' liked your post',
    jsonb_build_object('actor_id', NEW.user_id, 'post_id', NEW.post_id),
    '/travel-feed'
  );
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_new_like ON public.post_likes;
CREATE TRIGGER trigger_notify_new_like
  AFTER INSERT ON public.post_likes
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_like();

-- Function to notify on new follow
CREATE OR REPLACE FUNCTION notify_new_follow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  follower_username TEXT;
BEGIN
  -- Get follower username
  SELECT username INTO follower_username
  FROM profiles
  WHERE id = NEW.follower_id;
  
  -- Create notification
  INSERT INTO notifications (
    user_id,
    notification_type,
    title,
    message,
    metadata,
    link
  )
  VALUES (
    NEW.following_id,
    'follow',
    'New Follower',
    COALESCE(follower_username, 'Someone') || ' started following you',
    jsonb_build_object('actor_id', NEW.follower_id),
    '/travel-profile'
  );
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_new_follow ON public.user_follows;
CREATE TRIGGER trigger_notify_new_follow
  AFTER INSERT ON public.user_follows
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_follow();