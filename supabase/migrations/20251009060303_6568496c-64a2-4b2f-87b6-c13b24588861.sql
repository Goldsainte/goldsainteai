-- Add embed URL support to travel posts
ALTER TABLE public.travel_posts 
ADD COLUMN IF NOT EXISTS embed_url TEXT,
ADD COLUMN IF NOT EXISTS embed_platform TEXT CHECK (embed_platform IN ('tiktok', 'instagram', 'youtube')),
ADD COLUMN IF NOT EXISTS original_creator TEXT,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0;

-- Create creator rewards tracking table
CREATE TABLE IF NOT EXISTS public.creator_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('views', 'likes', 'shares', 'featured')),
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  post_id UUID REFERENCES public.travel_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on creator rewards
ALTER TABLE public.creator_rewards ENABLE ROW LEVEL SECURITY;

-- RLS policies for creator rewards
CREATE POLICY "Users can view their own rewards"
  ON public.creator_rewards FOR SELECT
  USING (auth.uid() = user_id);

-- Function to calculate creator earnings based on engagement
CREATE OR REPLACE FUNCTION calculate_creator_earnings(post_uuid UUID)
RETURNS NUMERIC AS $$
DECLARE
  total_earnings NUMERIC := 0;
  view_earnings NUMERIC := 0;
  like_earnings NUMERIC := 0;
  share_earnings NUMERIC := 0;
BEGIN
  -- Get engagement metrics
  SELECT 
    (view_count * 0.001) +  -- $0.001 per view
    (like_count * 0.01) +    -- $0.01 per like
    (share_count * 0.05)     -- $0.05 per share
  INTO total_earnings
  FROM public.travel_posts
  WHERE id = post_uuid;
  
  RETURN COALESCE(total_earnings, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_travel_posts_featured ON public.travel_posts(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_creator_rewards_user ON public.creator_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_travel_posts_engagement ON public.travel_posts(view_count DESC, like_count DESC);