-- Phase 8: Enhanced Trust & Safety

-- Customer identity verification table
CREATE TABLE IF NOT EXISTS public.customer_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('government_id', 'passport', 'drivers_license', 'selfie')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  document_url TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, verification_type)
);

-- Agent performance metrics table
CREATE TABLE IF NOT EXISTS public.agent_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.travel_agents(id) ON DELETE CASCADE,
  
  -- Response time metrics
  avg_first_response_minutes NUMERIC DEFAULT 0,
  avg_response_time_minutes NUMERIC DEFAULT 0,
  response_rate_percentage NUMERIC DEFAULT 100,
  
  -- Acceptance metrics
  total_bids_sent INTEGER DEFAULT 0,
  bids_accepted INTEGER DEFAULT 0,
  bids_declined INTEGER DEFAULT 0,
  acceptance_rate_percentage NUMERIC DEFAULT 0,
  
  -- Completion metrics
  jobs_completed INTEGER DEFAULT 0,
  jobs_cancelled INTEGER DEFAULT 0,
  completion_rate_percentage NUMERIC DEFAULT 100,
  
  -- Quality metrics
  avg_customer_rating NUMERIC DEFAULT 0,
  on_time_delivery_rate NUMERIC DEFAULT 100,
  
  -- Period tracking
  period_start DATE DEFAULT CURRENT_DATE,
  period_end DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(agent_id, period_start)
);

-- Agent response tracking for calculating metrics
CREATE TABLE IF NOT EXISTS public.agent_response_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.travel_agents(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.marketplace_jobs(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.marketplace_messages(id) ON DELETE CASCADE,
  
  inquiry_received_at TIMESTAMP WITH TIME ZONE NOT NULL,
  first_response_at TIMESTAMP WITH TIME ZONE,
  response_time_minutes NUMERIC,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Emergency contacts table
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  contact_name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT,
  
  is_primary BOOLEAN DEFAULT false,
  country_code TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Badge system for achievements
CREATE TABLE IF NOT EXISTS public.agent_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.travel_agents(id) ON DELETE CASCADE,
  
  badge_type TEXT NOT NULL CHECK (badge_type IN (
    'quick_responder',
    'high_acceptance',
    'top_rated',
    'experienced',
    'reliable',
    'specialist',
    'verified_elite',
    'customer_favorite'
  )),
  
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  valid_until TIMESTAMP WITH TIME ZONE,
  
  criteria_met JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(agent_id, badge_type)
);

-- Enable RLS
ALTER TABLE public.customer_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_response_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer_verifications
CREATE POLICY "Users can view their own verifications"
  ON public.customer_verifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own verifications"
  ON public.customer_verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all verifications"
  ON public.customer_verifications FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for agent_performance_metrics
CREATE POLICY "Agents can view their own metrics"
  ON public.agent_performance_metrics FOR SELECT
  USING (
    agent_id IN (
      SELECT id FROM public.travel_agents WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view agent metrics"
  ON public.agent_performance_metrics FOR SELECT
  USING (true);

-- RLS Policies for agent_response_tracking
CREATE POLICY "Agents can view their own tracking"
  ON public.agent_response_tracking FOR SELECT
  USING (
    agent_id IN (
      SELECT id FROM public.travel_agents WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for emergency_contacts
CREATE POLICY "Users can manage their own emergency contacts"
  ON public.emergency_contacts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for agent_badges
CREATE POLICY "Anyone can view agent badges"
  ON public.agent_badges FOR SELECT
  USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_customer_verifications_updated_at
  BEFORE UPDATE ON public.customer_verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_performance_metrics_updated_at
  BEFORE UPDATE ON public.agent_performance_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_emergency_contacts_updated_at
  BEFORE UPDATE ON public.emergency_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate and update agent performance metrics
CREATE OR REPLACE FUNCTION public.update_agent_performance_metrics(
  target_agent_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_bids INTEGER;
  accepted_bids INTEGER;
  avg_response NUMERIC;
  completed_jobs INTEGER;
  total_jobs INTEGER;
  avg_rating NUMERIC;
BEGIN
  -- Calculate bid acceptance rate
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'accepted')
  INTO total_bids, accepted_bids
  FROM public.agent_bids
  WHERE agent_id = target_agent_id;
  
  -- Calculate average response time
  SELECT AVG(response_time_minutes)
  INTO avg_response
  FROM public.agent_response_tracking
  WHERE agent_id = target_agent_id
    AND first_response_at IS NOT NULL;
  
  -- Calculate completion rate
  SELECT 
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*)
  INTO completed_jobs, total_jobs
  FROM public.marketplace_jobs
  WHERE assigned_agent_id = target_agent_id
    AND status IN ('completed', 'cancelled');
  
  -- Get average rating
  SELECT AVG(rating)
  INTO avg_rating
  FROM public.agent_reviews
  WHERE agent_id = target_agent_id;
  
  -- Insert or update metrics
  INSERT INTO public.agent_performance_metrics (
    agent_id,
    total_bids_sent,
    bids_accepted,
    acceptance_rate_percentage,
    avg_response_time_minutes,
    jobs_completed,
    completion_rate_percentage,
    avg_customer_rating,
    period_start
  ) VALUES (
    target_agent_id,
    COALESCE(total_bids, 0),
    COALESCE(accepted_bids, 0),
    CASE WHEN total_bids > 0 THEN (accepted_bids::NUMERIC / total_bids * 100) ELSE 0 END,
    COALESCE(avg_response, 0),
    COALESCE(completed_jobs, 0),
    CASE WHEN total_jobs > 0 THEN (completed_jobs::NUMERIC / total_jobs * 100) ELSE 100 END,
    COALESCE(avg_rating, 0),
    CURRENT_DATE
  )
  ON CONFLICT (agent_id, period_start)
  DO UPDATE SET
    total_bids_sent = EXCLUDED.total_bids_sent,
    bids_accepted = EXCLUDED.bids_accepted,
    acceptance_rate_percentage = EXCLUDED.acceptance_rate_percentage,
    avg_response_time_minutes = EXCLUDED.avg_response_time_minutes,
    jobs_completed = EXCLUDED.jobs_completed,
    completion_rate_percentage = EXCLUDED.completion_rate_percentage,
    avg_customer_rating = EXCLUDED.avg_customer_rating,
    updated_at = now();
    
  RETURN TRUE;
END;
$$;

-- Function to award badges based on performance
CREATE OR REPLACE FUNCTION public.evaluate_agent_badges(
  target_agent_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  metrics RECORD;
BEGIN
  -- Get current metrics
  SELECT * INTO metrics
  FROM public.agent_performance_metrics
  WHERE agent_id = target_agent_id
    AND period_start = CURRENT_DATE
  LIMIT 1;
  
  IF metrics IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Quick Responder Badge (avg response < 60 minutes)
  IF metrics.avg_response_time_minutes < 60 THEN
    INSERT INTO public.agent_badges (agent_id, badge_type, valid_until)
    VALUES (target_agent_id, 'quick_responder', now() + INTERVAL '90 days')
    ON CONFLICT (agent_id, badge_type) 
    DO UPDATE SET valid_until = now() + INTERVAL '90 days';
  END IF;
  
  -- High Acceptance Badge (acceptance rate > 80%)
  IF metrics.acceptance_rate_percentage > 80 AND metrics.total_bids_sent >= 10 THEN
    INSERT INTO public.agent_badges (agent_id, badge_type, valid_until)
    VALUES (target_agent_id, 'high_acceptance', now() + INTERVAL '90 days')
    ON CONFLICT (agent_id, badge_type)
    DO UPDATE SET valid_until = now() + INTERVAL '90 days';
  END IF;
  
  -- Top Rated Badge (avg rating > 4.8)
  IF metrics.avg_customer_rating >= 4.8 THEN
    INSERT INTO public.agent_badges (agent_id, badge_type, valid_until)
    VALUES (target_agent_id, 'top_rated', now() + INTERVAL '90 days')
    ON CONFLICT (agent_id, badge_type)
    DO UPDATE SET valid_until = now() + INTERVAL '90 days';
  END IF;
  
  -- Reliable Badge (completion rate > 95%)
  IF metrics.completion_rate_percentage > 95 AND metrics.jobs_completed >= 10 THEN
    INSERT INTO public.agent_badges (agent_id, badge_type, valid_until)
    VALUES (target_agent_id, 'reliable', now() + INTERVAL '90 days')
    ON CONFLICT (agent_id, badge_type)
    DO UPDATE SET valid_until = now() + INTERVAL '90 days';
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_verifications_user_id ON public.customer_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_verifications_status ON public.customer_verifications(status);
CREATE INDEX IF NOT EXISTS idx_agent_performance_metrics_agent_id ON public.agent_performance_metrics(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_response_tracking_agent_id ON public.agent_response_tracking(agent_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON public.emergency_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_badges_agent_id ON public.agent_badges(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_badges_type ON public.agent_badges(badge_type);
