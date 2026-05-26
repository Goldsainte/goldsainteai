-- Phase 7: AI-Powered Features, Loyalty System & Advanced Automation

-- Loyalty Points System
CREATE TABLE IF NOT EXISTS public.loyalty_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points_balance INTEGER NOT NULL DEFAULT 0,
  lifetime_points INTEGER NOT NULL DEFAULT 0,
  tier TEXT NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_loyalty_points_user ON public.loyalty_points(user_id);

-- RLS for loyalty_points
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own points"
  ON public.loyalty_points FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage points"
  ON public.loyalty_points FOR ALL
  USING ((current_setting('request.jwt.claims', true)::json->>'role')::text = 'service_role');

-- Points Transactions
CREATE TABLE IF NOT EXISTS public.points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points_amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn', 'redeem', 'expire', 'bonus', 'referral')),
  reason TEXT NOT NULL,
  related_entity_type TEXT,
  related_entity_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_points_txns_user ON public.points_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_points_txns_created ON public.points_transactions(created_at DESC);

-- RLS for points_transactions
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
  ON public.points_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Promotional Codes
CREATE TABLE IF NOT EXISTS public.promotional_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'points')),
  discount_value NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  min_order_value NUMERIC DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON public.promotional_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON public.promotional_codes(is_active);

-- RLS for promotional_codes
ALTER TABLE public.promotional_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active promo codes"
  ON public.promotional_codes FOR SELECT
  USING (is_active = true AND valid_until > now());

CREATE POLICY "Admins can manage promo codes"
  ON public.promotional_codes FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Promo Code Usage Tracking
CREATE TABLE IF NOT EXISTS public.promo_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES public.promotional_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.marketplace_jobs(id) ON DELETE SET NULL,
  discount_applied NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_promo_usage_code ON public.promo_code_usage(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_promo_usage_user ON public.promo_code_usage(user_id);

-- RLS for promo_code_usage
ALTER TABLE public.promo_code_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage"
  ON public.promo_code_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Referral Program
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded')),
  referrer_points_earned INTEGER DEFAULT 0,
  referred_points_earned INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(referrer_id, referred_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON public.referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals(referral_code);

-- RLS for referrals
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their referrals"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Agent Auto-Assignment Rules
CREATE TABLE IF NOT EXISTS public.auto_assignment_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.travel_agents(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  booking_types TEXT[],
  destinations TEXT[],
  min_budget NUMERIC,
  max_budget NUMERIC,
  specializations TEXT[],
  auto_accept BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auto_rules_agent ON public.auto_assignment_rules(agent_id);
CREATE INDEX IF NOT EXISTS idx_auto_rules_active ON public.auto_assignment_rules(is_active);

-- RLS for auto_assignment_rules
ALTER TABLE public.auto_assignment_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can manage their own rules"
  ON public.auto_assignment_rules FOR ALL
  USING (agent_id IN (
    SELECT id FROM public.travel_agents WHERE user_id = auth.uid()
  ))
  WITH CHECK (agent_id IN (
    SELECT id FROM public.travel_agents WHERE user_id = auth.uid()
  ));

-- AI Matching Scores (store ML-based matching results)
CREATE TABLE IF NOT EXISTS public.ai_matching_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.marketplace_jobs(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.travel_agents(id) ON DELETE CASCADE,
  match_score NUMERIC NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  confidence_level TEXT NOT NULL CHECK (confidence_level IN ('low', 'medium', 'high')),
  matching_factors JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(job_id, agent_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_scores_job ON public.ai_matching_scores(job_id);
CREATE INDEX IF NOT EXISTS idx_ai_scores_agent ON public.ai_matching_scores(agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_scores_score ON public.ai_matching_scores(match_score DESC);

-- RLS for ai_matching_scores
ALTER TABLE public.ai_matching_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Job owners can view matching scores"
  ON public.ai_matching_scores FOR SELECT
  USING (job_id IN (
    SELECT id FROM public.marketplace_jobs WHERE user_id = auth.uid()
  ));

CREATE POLICY "Agents can view their own scores"
  ON public.ai_matching_scores FOR SELECT
  USING (agent_id IN (
    SELECT id FROM public.travel_agents WHERE user_id = auth.uid()
  ));

-- Custom Reports Configuration
CREATE TABLE IF NOT EXISTS public.custom_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL CHECK (report_type IN ('financial', 'performance', 'customer', 'operational')),
  filters JSONB DEFAULT '{}'::jsonb,
  columns TEXT[],
  schedule TEXT,
  is_active BOOLEAN DEFAULT true,
  last_generated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_custom_reports_user ON public.custom_reports(user_id);

-- RLS for custom_reports
ALTER TABLE public.custom_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own reports"
  ON public.custom_reports FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to calculate loyalty tier
CREATE OR REPLACE FUNCTION public.calculate_loyalty_tier(lifetime_points_value INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF lifetime_points_value >= 10000 THEN
    RETURN 'platinum';
  ELSIF lifetime_points_value >= 5000 THEN
    RETURN 'gold';
  ELSIF lifetime_points_value >= 2000 THEN
    RETURN 'silver';
  ELSE
    RETURN 'bronze';
  END IF;
END;
$$;

-- Function to award points
CREATE OR REPLACE FUNCTION public.award_loyalty_points(
  target_user_id UUID,
  points INTEGER,
  transaction_reason TEXT,
  entity_type TEXT DEFAULT NULL,
  entity_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance INTEGER;
  current_lifetime INTEGER;
  new_tier TEXT;
BEGIN
  -- Insert transaction record
  INSERT INTO public.points_transactions (
    user_id, points_amount, transaction_type, reason, related_entity_type, related_entity_id
  ) VALUES (
    target_user_id, points, 'earn', transaction_reason, entity_type, entity_id
  );
  
  -- Update or create loyalty points record
  INSERT INTO public.loyalty_points (user_id, points_balance, lifetime_points)
  VALUES (target_user_id, points, points)
  ON CONFLICT (user_id) DO UPDATE
  SET 
    points_balance = public.loyalty_points.points_balance + points,
    lifetime_points = public.loyalty_points.lifetime_points + points,
    tier = calculate_loyalty_tier(public.loyalty_points.lifetime_points + points),
    updated_at = now();
    
  RETURN TRUE;
END;
$$;

-- Function to match agents with jobs using AI scoring
CREATE OR REPLACE FUNCTION public.find_matching_agents(
  target_job_id UUID,
  limit_count INTEGER DEFAULT 5
)
RETURNS TABLE (
  agent_id UUID,
  agency_name TEXT,
  rating NUMERIC,
  match_score NUMERIC,
  confidence_level TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.agency_name,
    a.rating,
    COALESCE(ams.match_score, 0) as match_score,
    COALESCE(ams.confidence_level, 'low'::TEXT) as confidence_level
  FROM public.travel_agents a
  LEFT JOIN public.ai_matching_scores ams ON ams.agent_id = a.id AND ams.job_id = target_job_id
  WHERE a.is_active = true AND a.is_verified = true
  ORDER BY match_score DESC, a.rating DESC
  LIMIT limit_count;
END;
$$;

-- Triggers
CREATE TRIGGER update_loyalty_points_updated_at
  BEFORE UPDATE ON public.loyalty_points
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_promotional_codes_updated_at
  BEFORE UPDATE ON public.promotional_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_auto_assignment_rules_updated_at
  BEFORE UPDATE ON public.auto_assignment_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_custom_reports_updated_at
  BEFORE UPDATE ON public.custom_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
