-- Make video_url nullable since posts can have either video_url OR embed_url
ALTER TABLE public.travel_posts 
ALTER COLUMN video_url DROP NOT NULL;

-- Add constraint to ensure at least one is present
ALTER TABLE public.travel_posts
ADD CONSTRAINT video_or_embed_required 
CHECK (video_url IS NOT NULL OR embed_url IS NOT NULL);