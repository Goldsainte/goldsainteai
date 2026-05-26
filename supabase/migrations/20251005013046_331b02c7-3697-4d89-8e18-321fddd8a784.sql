-- Phase 6: Advanced Features, Integrations & Platform Analytics

-- Activity Logs Table (audit trail)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('job', 'bid', 'payment', 'booking', 'agent', 'review', 'dispute', 'report')),
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'view', 'approve', 'reject', 'complete', 'cancel')),
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs(created_at DESC);

-- RLS for activity_logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activity logs"
  ON public.activity_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity logs"
  ON public.activity_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage activity logs"
  ON public.activity_logs FOR ALL
  USING ((current_setting('request.jwt.claims', true)::json->>'role')::text = 'service_role');

-- Webhook Configurations Table
CREATE TABLE IF NOT EXISTS public.webhook_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT,
  events TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT true,
  retry_attempts INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 30,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_configs_user ON public.webhook_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_configs_active ON public.webhook_configurations(is_active);

-- RLS for webhook_configurations
ALTER TABLE public.webhook_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own webhooks"
  ON public.webhook_configurations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Webhook Delivery Logs
CREATE TABLE IF NOT EXISTS public.webhook_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES public.webhook_configurations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  error_message TEXT,
  attempt_number INTEGER DEFAULT 1,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook ON public.webhook_delivery_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event ON public.webhook_delivery_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created ON public.webhook_delivery_logs(created_at DESC);

-- RLS for webhook_delivery_logs
ALTER TABLE public.webhook_delivery_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their webhook logs"
  ON public.webhook_delivery_logs FOR SELECT
  USING (webhook_id IN (
    SELECT id FROM public.webhook_configurations WHERE user_id = auth.uid()
  ));

-- Platform Analytics View (admin only)
CREATE OR REPLACE VIEW public.platform_analytics AS
SELECT
  -- User metrics
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM public.travel_agents WHERE is_verified = true) as verified_agents,
  (SELECT COUNT(*) FROM public.travel_agents WHERE is_active = true) as active_agents,
  
  -- Job metrics
  (SELECT COUNT(*) FROM public.marketplace_jobs) as total_jobs,
  (SELECT COUNT(*) FROM public.marketplace_jobs WHERE status = 'open') as open_jobs,
  (SELECT COUNT(*) FROM public.marketplace_jobs WHERE status = 'in_progress') as in_progress_jobs,
  (SELECT COUNT(*) FROM public.marketplace_jobs WHERE status = 'completed') as completed_jobs,
  
  -- Financial metrics
  (SELECT COALESCE(SUM(agent_payout_amount), 0) FROM public.marketplace_jobs WHERE status = 'completed') as total_agent_payouts,
  (SELECT COALESCE(SUM(service_fee_collected), 0) FROM public.marketplace_jobs WHERE status = 'completed') as total_service_fees,
  (SELECT COALESCE(SUM(success_fee_collected), 0) FROM public.marketplace_jobs WHERE status = 'completed') as total_success_fees,
  
  -- Review metrics
  (SELECT COUNT(*) FROM public.agent_reviews) as total_reviews,
  (SELECT COALESCE(AVG(rating), 0) FROM public.agent_reviews) as average_rating,
  
  -- Trust & Safety metrics
  (SELECT COUNT(*) FROM public.user_reports WHERE status = 'pending') as pending_reports,
  (SELECT COUNT(*) FROM public.marketplace_disputes WHERE status = 'open') as open_disputes;

-- Search function for jobs with advanced filters
CREATE OR REPLACE FUNCTION public.search_marketplace_jobs(
  search_query TEXT DEFAULT NULL,
  job_status TEXT DEFAULT NULL,
  booking_type_filter TEXT DEFAULT NULL,
  min_budget NUMERIC DEFAULT NULL,
  max_budget NUMERIC DEFAULT NULL,
  destination_filter TEXT DEFAULT NULL,
  user_id_filter UUID DEFAULT NULL,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  booking_type TEXT,
  destination TEXT,
  status TEXT,
  budget_min NUMERIC,
  budget_max NUMERIC,
  currency TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  user_id UUID,
  bid_count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.id,
    j.title,
    j.description,
    j.booking_type,
    j.destination,
    j.status,
    j.budget_min,
    j.budget_max,
    j.currency,
    j.created_at,
    j.expires_at,
    j.user_id,
    COALESCE((SELECT COUNT(*) FROM public.agent_bids WHERE job_id = j.id), 0) as bid_count
  FROM public.marketplace_jobs j
  WHERE 
    (search_query IS NULL OR 
      j.title ILIKE '%' || search_query || '%' OR 
      j.description ILIKE '%' || search_query || '%' OR
      j.destination ILIKE '%' || search_query || '%')
    AND (job_status IS NULL OR j.status = job_status)
    AND (booking_type_filter IS NULL OR j.booking_type = booking_type_filter)
    AND (min_budget IS NULL OR j.budget_max >= min_budget)
    AND (max_budget IS NULL OR j.budget_min <= max_budget)
    AND (destination_filter IS NULL OR j.destination ILIKE '%' || destination_filter || '%')
    AND (user_id_filter IS NULL OR j.user_id = user_id_filter)
  ORDER BY j.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- Search function for agents with advanced filters
CREATE OR REPLACE FUNCTION public.search_travel_agents(
  search_query TEXT DEFAULT NULL,
  min_rating NUMERIC DEFAULT NULL,
  specialization_filter TEXT[] DEFAULT NULL,
  destination_filter TEXT[] DEFAULT NULL,
  language_filter TEXT[] DEFAULT NULL,
  is_verified_filter BOOLEAN DEFAULT NULL,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  agency_name TEXT,
  bio TEXT,
  rating NUMERIC,
  total_reviews INTEGER,
  experience_years INTEGER,
  specializations TEXT[],
  destinations TEXT[],
  languages TEXT[],
  is_verified BOOLEAN,
  is_active BOOLEAN,
  profile_image_url TEXT,
  commission_rate NUMERIC
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
    a.bio,
    a.rating,
    a.total_reviews,
    a.experience_years,
    a.specializations,
    a.destinations,
    a.languages,
    a.is_verified,
    a.is_active,
    a.profile_image_url,
    a.commission_rate
  FROM public.travel_agents a
  WHERE 
    a.is_active = true
    AND (search_query IS NULL OR 
      a.agency_name ILIKE '%' || search_query || '%' OR 
      a.bio ILIKE '%' || search_query || '%')
    AND (min_rating IS NULL OR a.rating >= min_rating)
    AND (is_verified_filter IS NULL OR a.is_verified = is_verified_filter)
    AND (specialization_filter IS NULL OR a.specializations && specialization_filter)
    AND (destination_filter IS NULL OR a.destinations && destination_filter)
    AND (language_filter IS NULL OR a.languages && language_filter)
  ORDER BY a.rating DESC, a.total_reviews DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- Triggers
CREATE TRIGGER update_webhook_configurations_updated_at
  BEFORE UPDATE ON public.webhook_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
