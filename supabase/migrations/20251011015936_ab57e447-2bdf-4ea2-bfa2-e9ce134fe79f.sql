-- Drop the old constraint that only allowed video or embed
ALTER TABLE public.travel_posts 
DROP CONSTRAINT IF EXISTS video_or_embed_required;

-- Add new constraint that allows video, embed, OR photos
ALTER TABLE public.travel_posts 
ADD CONSTRAINT media_content_required 
CHECK (
  video_url IS NOT NULL 
  OR embed_url IS NOT NULL 
  OR (image_urls IS NOT NULL AND array_length(image_urls, 1) > 0)
);