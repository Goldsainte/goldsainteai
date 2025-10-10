-- Add new columns to travel_posts for advanced analytics
ALTER TABLE travel_posts 
ADD COLUMN IF NOT EXISTS video_duration_seconds INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_watch_time_seconds INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_watch_percentage NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS viewer_region_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS is_original_content BOOLEAN DEFAULT true;

-- Create a more sophisticated earnings calculation function
CREATE OR REPLACE FUNCTION public.calculate_advanced_creator_earnings(
  p_video_duration INTEGER,
  p_watch_time INTEGER,
  p_retention_rate NUMERIC,
  p_views INTEGER,
  p_likes INTEGER,
  p_shares INTEGER,
  p_comments INTEGER,
  p_region_multiplier NUMERIC DEFAULT 1.0
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  base_earnings NUMERIC := 0;
  duration_bonus NUMERIC := 0;
  retention_bonus NUMERIC := 0;
  engagement_score NUMERIC := 0;
  total_earnings NUMERIC := 0;
BEGIN
  -- Base earnings from views (reduced rate)
  base_earnings := p_views * 0.0005; -- $0.0005 per view
  
  -- Duration bonus: longer videos earn more
  -- 0-30 sec: 1x, 31-60 sec: 1.2x, 61-180 sec: 1.5x, 181+ sec: 2x
  IF p_video_duration <= 30 THEN
    duration_bonus := base_earnings * 0;
  ELSIF p_video_duration <= 60 THEN
    duration_bonus := base_earnings * 0.2;
  ELSIF p_video_duration <= 180 THEN
    duration_bonus := base_earnings * 0.5;
  ELSE
    duration_bonus := base_earnings * 1.0;
  END IF;
  
  -- Retention bonus: higher retention = more earnings
  -- Good retention (>50%) gets bonus
  IF p_retention_rate >= 50 THEN
    retention_bonus := base_earnings * (p_retention_rate / 100);
  END IF;
  
  -- Engagement score (likes, comments, shares contribute)
  engagement_score := (p_likes * 0.01) + (p_comments * 0.02) + (p_shares * 0.05);
  
  -- Calculate total with region multiplier
  total_earnings := (base_earnings + duration_bonus + retention_bonus + engagement_score) * p_region_multiplier;
  
  RETURN GREATEST(total_earnings, 0);
END;
$$;

-- Add creator verification table for tracking eligibility
CREATE TABLE IF NOT EXISTS creator_verification_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  is_verified_creator BOOLEAN DEFAULT false,
  total_followers INTEGER DEFAULT 0,
  views_last_30_days INTEGER DEFAULT 0,
  original_content_count INTEGER DEFAULT 0,
  total_content_count INTEGER DEFAULT 0,
  verification_date TIMESTAMP WITH TIME ZONE,
  last_checked TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE creator_verification_status ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own status
CREATE POLICY "Users can view own verification status"
ON creator_verification_status
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Service role can manage
CREATE POLICY "Service role can manage verification"
ON creator_verification_status
FOR ALL
USING ((current_setting('request.jwt.claims'::text, true)::json ->> 'role'::text) = 'service_role');

-- Create updated_at trigger
CREATE TRIGGER update_creator_verification_updated_at
BEFORE UPDATE ON creator_verification_status
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function to check if user meets creator requirements
CREATE OR REPLACE FUNCTION check_creator_eligibility(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  follower_count INTEGER;
  recent_views INTEGER;
  original_count INTEGER;
  total_count INTEGER;
BEGIN
  -- Count followers
  SELECT COUNT(*) INTO follower_count
  FROM user_follows
  WHERE following_id = p_user_id;
  
  -- Count views in last 30 days
  SELECT COALESCE(SUM(view_count), 0) INTO recent_views
  FROM travel_posts
  WHERE user_id = p_user_id
    AND created_at >= now() - INTERVAL '30 days';
  
  -- Count original vs total content
  SELECT 
    COUNT(*) FILTER (WHERE is_original_content = true),
    COUNT(*)
  INTO original_count, total_count
  FROM travel_posts
  WHERE user_id = p_user_id;
  
  -- Update verification status
  INSERT INTO creator_verification_status (
    user_id,
    is_verified_creator,
    total_followers,
    views_last_30_days,
    original_content_count,
    total_content_count,
    verification_date,
    last_checked
  )
  VALUES (
    p_user_id,
    follower_count >= 10000 AND recent_views >= 100000 AND (original_count::FLOAT / GREATEST(total_count, 1)) >= 0.8,
    follower_count,
    recent_views,
    original_count,
    total_count,
    CASE WHEN follower_count >= 10000 AND recent_views >= 100000 THEN now() ELSE NULL END,
    now()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    is_verified_creator = follower_count >= 10000 AND recent_views >= 100000 AND (original_count::FLOAT / GREATEST(total_count, 1)) >= 0.8,
    total_followers = follower_count,
    views_last_30_days = recent_views,
    original_content_count = original_count,
    total_content_count = total_count,
    verification_date = CASE WHEN follower_count >= 10000 AND recent_views >= 100000 THEN COALESCE(creator_verification_status.verification_date, now()) ELSE NULL END,
    last_checked = now(),
    updated_at = now();
  
  -- Return eligibility
  RETURN follower_count >= 10000 AND recent_views >= 100000 AND (original_count::FLOAT / GREATEST(total_count, 1)) >= 0.8;
END;
$$;