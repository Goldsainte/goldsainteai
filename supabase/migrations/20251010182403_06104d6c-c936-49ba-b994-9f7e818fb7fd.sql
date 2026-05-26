-- Create creator_tiers table
CREATE TABLE IF NOT EXISTS public.creator_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tier_name TEXT NOT NULL UNIQUE CHECK (tier_name IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
  tier_level INTEGER NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  min_followers INTEGER NOT NULL DEFAULT 0,
  min_posts INTEGER NOT NULL DEFAULT 0,
  min_engagement_rate NUMERIC DEFAULT 0,
  min_monthly_earnings NUMERIC DEFAULT 0,
  benefits JSONB DEFAULT '[]',
  commission_bonus_percentage NUMERIC DEFAULT 0,
  priority_support BOOLEAN DEFAULT false,
  early_access_features BOOLEAN DEFAULT false,
  custom_branding BOOLEAN DEFAULT false,
  analytics_access BOOLEAN DEFAULT false,
  api_access BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create creator_tier_memberships table
CREATE TABLE IF NOT EXISTS public.creator_tier_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_tier TEXT NOT NULL REFERENCES public.creator_tiers(tier_name) ON DELETE RESTRICT,
  previous_tier TEXT REFERENCES public.creator_tiers(tier_name),
  tier_since TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  next_evaluation_date DATE,
  auto_upgrade_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create tier_progress_metrics table
CREATE TABLE IF NOT EXISTS public.tier_progress_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_followers INTEGER DEFAULT 0,
  current_posts INTEGER DEFAULT 0,
  current_engagement_rate NUMERIC DEFAULT 0,
  monthly_earnings NUMERIC DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  average_rating NUMERIC DEFAULT 0,
  completion_rate NUMERIC DEFAULT 100,
  response_time_hours NUMERIC DEFAULT 0,
  last_calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create tier_upgrade_history table
CREATE TABLE IF NOT EXISTS public.tier_upgrade_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_tier TEXT NOT NULL,
  to_tier TEXT NOT NULL,
  upgrade_type TEXT NOT NULL CHECK (upgrade_type IN ('automatic', 'manual', 'promotional', 'downgrade')),
  reason TEXT,
  metrics_snapshot JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.creator_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_tier_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tier_progress_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tier_upgrade_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for creator_tiers
CREATE POLICY "Anyone can view tier information"
  ON public.creator_tiers FOR SELECT
  USING (true);

-- RLS Policies for creator_tier_memberships
CREATE POLICY "Users can view their own tier membership"
  ON public.creator_tier_memberships FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view other creators' current tier"
  ON public.creator_tier_memberships FOR SELECT
  USING (true);

-- RLS Policies for tier_progress_metrics
CREATE POLICY "Users can view their own progress metrics"
  ON public.tier_progress_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage progress metrics"
  ON public.tier_progress_metrics FOR ALL
  USING (((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'service_role'::text);

-- RLS Policies for tier_upgrade_history
CREATE POLICY "Users can view their own upgrade history"
  ON public.tier_upgrade_history FOR SELECT
  USING (auth.uid() = user_id);

-- Insert default tiers
INSERT INTO public.creator_tiers (tier_name, tier_level, display_name, description, min_followers, min_posts, min_engagement_rate, min_monthly_earnings, benefits, commission_bonus_percentage, priority_support, analytics_access) VALUES
('bronze', 1, 'Bronze Creator', 'Starting tier for new creators', 0, 0, 0, 0, 
  '["Access to basic features", "Standard support", "Community forums"]'::jsonb, 
  0, false, false),
('silver', 2, 'Silver Creator', 'For growing creators with consistent engagement', 1000, 10, 2.0, 100, 
  '["All Bronze benefits", "Priority email support", "Basic analytics dashboard", "5% commission bonus"]'::jsonb, 
  5, false, true),
('gold', 3, 'Gold Creator', 'For established creators with strong performance', 5000, 50, 3.5, 500, 
  '["All Silver benefits", "Priority support", "Advanced analytics", "10% commission bonus", "Early access to features", "Custom branding options"]'::jsonb, 
  10, true, true),
('platinum', 4, 'Platinum Creator', 'For top-tier creators with exceptional metrics', 25000, 100, 5.0, 2000, 
  '["All Gold benefits", "Dedicated account manager", "Full analytics suite", "15% commission bonus", "API access", "Featured placement"]'::jsonb, 
  15, true, true),
('diamond', 5, 'Diamond Creator', 'Elite tier for the most successful creators', 100000, 250, 7.0, 10000, 
  '["All Platinum benefits", "VIP support", "Custom integration", "20% commission bonus", "Revenue sharing opportunities", "Exclusive partnership opportunities"]'::jsonb, 
  20, true, true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tier_memberships_user ON public.creator_tier_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_tier_memberships_tier ON public.creator_tier_memberships(current_tier);
CREATE INDEX IF NOT EXISTS idx_tier_progress_user ON public.tier_progress_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_tier_history_user ON public.tier_upgrade_history(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_creator_tiers_updated_at
  BEFORE UPDATE ON public.creator_tiers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_creator_tier_memberships_updated_at
  BEFORE UPDATE ON public.creator_tier_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tier_progress_metrics_updated_at
  BEFORE UPDATE ON public.tier_progress_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate and update tier progress
CREATE OR REPLACE FUNCTION public.calculate_creator_tier_progress(
  p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_followers INTEGER;
  v_posts INTEGER;
  v_engagement_rate NUMERIC;
  v_monthly_earnings NUMERIC;
  v_bookings INTEGER;
  v_avg_rating NUMERIC;
BEGIN
  -- Get follower count
  SELECT COUNT(*) INTO v_followers
  FROM public.user_follows
  WHERE following_id = p_user_id;
  
  -- Get post count
  SELECT COUNT(*) INTO v_posts
  FROM public.travel_posts
  WHERE user_id = p_user_id;
  
  -- Calculate engagement rate (likes + comments / posts / followers * 100)
  SELECT 
    CASE 
      WHEN v_followers > 0 AND v_posts > 0 THEN
        ((SUM(like_count + comment_count)::NUMERIC / v_posts) / v_followers * 100)
      ELSE 0
    END INTO v_engagement_rate
  FROM public.travel_posts
  WHERE user_id = p_user_id;
  
  -- Calculate monthly earnings (last 30 days)
  SELECT COALESCE(SUM(amount), 0) INTO v_monthly_earnings
  FROM public.creator_earnings
  WHERE user_id = p_user_id
    AND created_at >= now() - INTERVAL '30 days'
    AND status = 'completed';
  
  -- Get total bookings
  SELECT COUNT(*) INTO v_bookings
  FROM public.package_bookings pb
  JOIN public.package_marketing_materials pmm ON pb.package_id = pmm.id
  WHERE pmm.creator_id = p_user_id;
  
  -- Get average rating from reviews
  SELECT AVG(rating) INTO v_avg_rating
  FROM public.agent_reviews
  WHERE agent_id IN (
    SELECT id FROM public.travel_agents WHERE user_id = p_user_id
  );
  
  -- Upsert progress metrics
  INSERT INTO public.tier_progress_metrics (
    user_id,
    current_followers,
    current_posts,
    current_engagement_rate,
    monthly_earnings,
    total_bookings,
    average_rating,
    last_calculated_at
  ) VALUES (
    p_user_id,
    v_followers,
    v_posts,
    COALESCE(v_engagement_rate, 0),
    v_monthly_earnings,
    v_bookings,
    COALESCE(v_avg_rating, 0),
    now()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    current_followers = EXCLUDED.current_followers,
    current_posts = EXCLUDED.current_posts,
    current_engagement_rate = EXCLUDED.current_engagement_rate,
    monthly_earnings = EXCLUDED.monthly_earnings,
    total_bookings = EXCLUDED.total_bookings,
    average_rating = EXCLUDED.average_rating,
    last_calculated_at = now(),
    updated_at = now();
  
  RETURN jsonb_build_object(
    'followers', v_followers,
    'posts', v_posts,
    'engagement_rate', COALESCE(v_engagement_rate, 0),
    'monthly_earnings', v_monthly_earnings,
    'bookings', v_bookings,
    'average_rating', COALESCE(v_avg_rating, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to evaluate and upgrade tier
CREATE OR REPLACE FUNCTION public.evaluate_and_upgrade_creator_tier(
  p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_metrics RECORD;
  v_current_tier TEXT;
  v_eligible_tier TEXT;
  v_max_tier_level INTEGER := 0;
BEGIN
  -- Calculate latest metrics
  PERFORM public.calculate_creator_tier_progress(p_user_id);
  
  -- Get current metrics
  SELECT * INTO v_metrics
  FROM public.tier_progress_metrics
  WHERE user_id = p_user_id;
  
  IF v_metrics IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No metrics found');
  END IF;
  
  -- Get current tier
  SELECT current_tier INTO v_current_tier
  FROM public.creator_tier_memberships
  WHERE user_id = p_user_id;
  
  -- Find highest eligible tier
  SELECT tier_name, tier_level INTO v_eligible_tier, v_max_tier_level
  FROM public.creator_tiers
  WHERE v_metrics.current_followers >= min_followers
    AND v_metrics.current_posts >= min_posts
    AND v_metrics.current_engagement_rate >= min_engagement_rate
    AND v_metrics.monthly_earnings >= min_monthly_earnings
  ORDER BY tier_level DESC
  LIMIT 1;
  
  -- If no tier membership exists, create one
  IF v_current_tier IS NULL THEN
    INSERT INTO public.creator_tier_memberships (
      user_id,
      current_tier,
      tier_since
    ) VALUES (
      p_user_id,
      COALESCE(v_eligible_tier, 'bronze'),
      now()
    );
    
    INSERT INTO public.tier_upgrade_history (
      user_id,
      from_tier,
      to_tier,
      upgrade_type,
      reason,
      metrics_snapshot
    ) VALUES (
      p_user_id,
      'none',
      COALESCE(v_eligible_tier, 'bronze'),
      'automatic',
      'Initial tier assignment',
      row_to_json(v_metrics)::jsonb
    );
    
    RETURN jsonb_build_object(
      'success', true,
      'tier_changed', true,
      'new_tier', COALESCE(v_eligible_tier, 'bronze'),
      'previous_tier', null
    );
  END IF;
  
  -- Check if upgrade is needed
  IF v_eligible_tier IS NOT NULL AND v_eligible_tier != v_current_tier THEN
    -- Get tier levels for comparison
    DECLARE
      v_current_level INTEGER;
    BEGIN
      SELECT tier_level INTO v_current_level
      FROM public.creator_tiers
      WHERE tier_name = v_current_tier;
      
      -- Only upgrade if new tier is higher
      IF v_max_tier_level > v_current_level THEN
        UPDATE public.creator_tier_memberships
        SET 
          previous_tier = current_tier,
          current_tier = v_eligible_tier,
          tier_since = now(),
          updated_at = now()
        WHERE user_id = p_user_id;
        
        INSERT INTO public.tier_upgrade_history (
          user_id,
          from_tier,
          to_tier,
          upgrade_type,
          reason,
          metrics_snapshot
        ) VALUES (
          p_user_id,
          v_current_tier,
          v_eligible_tier,
          'automatic',
          'Metrics threshold reached',
          row_to_json(v_metrics)::jsonb
        );
        
        -- Create notification
        INSERT INTO public.notifications (
          user_id,
          notification_type,
          title,
          message,
          metadata
        ) VALUES (
          p_user_id,
          'tier_upgrade',
          'Creator Tier Upgraded!',
          'Congratulations! You''ve been upgraded to ' || v_eligible_tier || ' tier',
          jsonb_build_object('new_tier', v_eligible_tier, 'previous_tier', v_current_tier)
        );
        
        RETURN jsonb_build_object(
          'success', true,
          'tier_changed', true,
          'new_tier', v_eligible_tier,
          'previous_tier', v_current_tier
        );
      END IF;
    END;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'tier_changed', false,
    'current_tier', v_current_tier
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
