-- Add indexes for travel_posts feed performance (keyset pagination)
CREATE INDEX IF NOT EXISTS idx_travel_posts_created_id ON public.travel_posts(created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_travel_posts_user_created ON public.travel_posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_travel_posts_status_created ON public.travel_posts(status, created_at DESC, id DESC);

-- Add indexes for post interactions (prevent N+1)
CREATE INDEX IF NOT EXISTS idx_post_likes_post_user ON public.post_likes(post_id, user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post ON public.post_comments(post_id, created_at DESC);

-- Add indexes for moments feed performance
CREATE INDEX IF NOT EXISTS idx_moments_created_id ON public.moments(created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_moments_user_created ON public.moments(user_id, created_at DESC);

-- Add indexes for moment interactions
CREATE INDEX IF NOT EXISTS idx_moment_reactions_moment_user ON public.moment_reactions(moment_id, user_id);

-- Ensure unique constraint to prevent duplicate likes under load
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uniq_post_like_per_user'
  ) THEN
    ALTER TABLE public.post_likes 
    ADD CONSTRAINT uniq_post_like_per_user UNIQUE (post_id, user_id);
  END IF;
END $$;