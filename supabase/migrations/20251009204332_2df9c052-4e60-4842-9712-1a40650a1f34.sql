-- Add support for photo posts and user tagging
DO $$ BEGIN
  -- Add image_urls column for photo posts (array of URLs)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'travel_posts' 
    AND column_name = 'image_urls'
  ) THEN
    ALTER TABLE public.travel_posts ADD COLUMN image_urls TEXT[];
  END IF;

  -- Add media_type column to distinguish between photo/video/mixed posts
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'travel_posts' 
    AND column_name = 'media_type'
  ) THEN
    ALTER TABLE public.travel_posts 
      ADD COLUMN media_type TEXT DEFAULT 'video' CHECK (media_type IN ('photo', 'video', 'embed'));
  END IF;
END $$;

-- CREATE TABLE IF NOT EXISTS for tagged users in posts
CREATE TABLE IF NOT EXISTS public.post_user_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.travel_posts(id) ON DELETE CASCADE,
  tagged_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, tagged_user_id)
);

-- Enable RLS on post_user_tags
ALTER TABLE public.post_user_tags ENABLE ROW LEVEL SECURITY;

-- Anyone can view tags
CREATE POLICY "Anyone can view user tags"
  ON public.post_user_tags
  FOR SELECT
  USING (true);

-- Post owners can create tags
CREATE POLICY "Post owners can create tags"
  ON public.post_user_tags
  FOR INSERT
  WITH CHECK (
    post_id IN (
      SELECT id FROM public.travel_posts WHERE user_id = auth.uid()
    )
  );

-- Post owners can delete tags
CREATE POLICY "Post owners can delete tags"
  ON public.post_user_tags
  FOR DELETE
  USING (
    post_id IN (
      SELECT id FROM public.travel_posts WHERE user_id = auth.uid()
    )
  );

-- CREATE INDEX IF NOT EXISTS for performance
CREATE INDEX IF NOT EXISTS idx_post_user_tags_post ON public.post_user_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_user_tags_user ON public.post_user_tags(tagged_user_id);
CREATE INDEX IF NOT EXISTS idx_travel_posts_media_type ON public.travel_posts(media_type);

-- Create notification trigger for user tags
CREATE OR REPLACE FUNCTION public.notify_user_tag()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_owner_id UUID;
  tagger_username TEXT;
  post_caption TEXT;
BEGIN
  -- Get post owner and caption
  SELECT user_id, caption INTO post_owner_id, post_caption
  FROM travel_posts
  WHERE id = NEW.post_id;
  
  -- Don't notify if tagging yourself
  IF NEW.tagged_user_id = post_owner_id THEN
    RETURN NEW;
  END IF;
  
  -- Get tagger username
  SELECT username INTO tagger_username
  FROM profiles
  WHERE id = post_owner_id;
  
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
    NEW.tagged_user_id,
    'tag',
    'You were tagged',
    COALESCE(tagger_username, 'Someone') || ' tagged you in a post',
    jsonb_build_object('actor_id', post_owner_id, 'post_id', NEW.post_id),
    '/travel-feed'
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for user tag notifications
DROP TRIGGER IF EXISTS trigger_notify_user_tag ON public.post_user_tags;
CREATE TRIGGER trigger_notify_user_tag
  AFTER INSERT ON public.post_user_tags
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_user_tag();
