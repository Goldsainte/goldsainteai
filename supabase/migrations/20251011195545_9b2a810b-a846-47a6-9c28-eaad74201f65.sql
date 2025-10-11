-- Wire notifications and counters for likes and comments
-- Drop existing triggers if any to avoid duplicates
DROP TRIGGER IF EXISTS trg_post_likes_update_count ON public.post_likes;
DROP TRIGGER IF EXISTS trg_post_likes_notify ON public.post_likes;
DROP TRIGGER IF EXISTS trg_post_comments_update_count ON public.post_comments;
DROP TRIGGER IF EXISTS trg_post_comments_notify ON public.post_comments;

-- Increment/decrement like_count on travel_posts when likes change
CREATE TRIGGER trg_post_likes_update_count
AFTER INSERT OR DELETE ON public.post_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_post_like_count();

-- Send notification to post owner when a new like occurs
CREATE TRIGGER trg_post_likes_notify
AFTER INSERT ON public.post_likes
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_like();

-- Increment/decrement comment_count on travel_posts when comments change
CREATE TRIGGER trg_post_comments_update_count
AFTER INSERT OR DELETE ON public.post_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_post_comment_count();

-- Send notification to post owner when a new comment occurs
CREATE TRIGGER trg_post_comments_notify
AFTER INSERT ON public.post_comments
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_comment();