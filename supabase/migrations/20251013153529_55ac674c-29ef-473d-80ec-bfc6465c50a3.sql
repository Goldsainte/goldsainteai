-- Engagement Fraud Prevention System

-- Table to track engagement rate limits per user
CREATE TABLE IF NOT EXISTS public.engagement_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('like', 'comment', 'share', 'follow')),
  action_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, action_type, window_start)
);

-- Table to log suspicious activity
CREATE TABLE IF NOT EXISTS public.suspicious_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('rapid_engagement', 'multiple_accounts', 'bot_pattern', 'ip_abuse', 'new_account_spam')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  flagged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  reviewed BOOLEAN DEFAULT FALSE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  action_taken TEXT CHECK (action_taken IN ('none', 'warning', 'temporary_restriction', 'permanent_ban', 'cleared')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table to track IP addresses for duplicate account detection
CREATE TABLE IF NOT EXISTS public.user_ip_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ip_address TEXT NOT NULL,
  first_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  action_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, ip_address)
);

-- Table for temporary account restrictions
CREATE TABLE IF NOT EXISTS public.account_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  restriction_type TEXT NOT NULL CHECK (restriction_type IN ('engagement_limit', 'comment_disabled', 'like_disabled', 'share_disabled', 'full_restriction')),
  reason TEXT NOT NULL,
  restricted_until TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID,
  lifted_at TIMESTAMP WITH TIME ZONE,
  lifted_by UUID
);

-- Add IP tracking to post_likes
ALTER TABLE public.post_likes 
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add IP tracking to post_comments
ALTER TABLE public.post_comments
ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- Add IP tracking to user_follows
ALTER TABLE public.user_follows
ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- Function to check if user can perform engagement action
CREATE OR REPLACE FUNCTION public.can_perform_engagement(
  p_user_id UUID,
  p_action_type TEXT,
  p_ip_address TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_age INTERVAL;
  v_hourly_limit INTEGER;
  v_current_count INTEGER;
  v_active_restrictions INTEGER;
  v_ip_users_count INTEGER;
  v_result JSONB;
BEGIN
  -- Set limits based on action type
  v_hourly_limit := CASE p_action_type
    WHEN 'like' THEN 100
    WHEN 'comment' THEN 30
    WHEN 'share' THEN 20
    WHEN 'follow' THEN 50
    ELSE 50
  END;

  -- Check account age (must be at least 1 hour old to engage)
  SELECT NOW() - created_at INTO v_account_age
  FROM auth.users
  WHERE id = p_user_id;

  IF v_account_age < INTERVAL '1 hour' THEN
    RETURN jsonb_build_object(
      'allowed', FALSE,
      'reason', 'new_account',
      'message', 'New accounts must wait 1 hour before engaging with content',
      'retry_after', EXTRACT(EPOCH FROM (INTERVAL '1 hour' - v_account_age))
    );
  END IF;

  -- Check for active restrictions
  SELECT COUNT(*) INTO v_active_restrictions
  FROM public.account_restrictions
  WHERE user_id = p_user_id
    AND is_active = TRUE
    AND restricted_until > NOW()
    AND (restriction_type = 'full_restriction' OR restriction_type = (p_action_type || '_disabled'));

  IF v_active_restrictions > 0 THEN
    RETURN jsonb_build_object(
      'allowed', FALSE,
      'reason', 'restricted',
      'message', 'Your account is temporarily restricted from this action'
    );
  END IF;

  -- Check hourly rate limit
  SELECT COALESCE(SUM(action_count), 0) INTO v_current_count
  FROM public.engagement_rate_limits
  WHERE user_id = p_user_id
    AND action_type = p_action_type
    AND window_start > NOW() - INTERVAL '1 hour';

  IF v_current_count >= v_hourly_limit THEN
    RETURN jsonb_build_object(
      'allowed', FALSE,
      'reason', 'rate_limit',
      'message', 'You have reached the hourly limit for this action',
      'retry_after', 3600
    );
  END IF;

  -- Check for IP abuse (multiple accounts from same IP)
  IF p_ip_address IS NOT NULL THEN
    SELECT COUNT(DISTINCT user_id) INTO v_ip_users_count
    FROM public.user_ip_tracking
    WHERE ip_address = p_ip_address
      AND last_seen > NOW() - INTERVAL '24 hours';

    IF v_ip_users_count > 5 THEN
      -- Log suspicious activity
      INSERT INTO public.suspicious_activity_logs (
        user_id, activity_type, severity, details, ip_address
      ) VALUES (
        p_user_id, 'ip_abuse', 'high',
        jsonb_build_object('ip_users_count', v_ip_users_count, 'action', p_action_type),
        p_ip_address
      );

      RETURN jsonb_build_object(
        'allowed', FALSE,
        'reason', 'ip_abuse',
        'message', 'Suspicious activity detected from your IP address'
      );
    END IF;
  END IF;

  -- All checks passed
  RETURN jsonb_build_object('allowed', TRUE, 'remaining', v_hourly_limit - v_current_count);
END;
$$;

-- Function to record engagement action
CREATE OR REPLACE FUNCTION public.record_engagement_action(
  p_user_id UUID,
  p_action_type TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start TIMESTAMP WITH TIME ZONE;
  v_recent_actions INTEGER;
BEGIN
  -- Round to current hour for rate limiting window
  v_window_start := DATE_TRUNC('hour', NOW());

  -- Upsert rate limit tracking
  INSERT INTO public.engagement_rate_limits (user_id, action_type, window_start, action_count)
  VALUES (p_user_id, p_action_type, v_window_start, 1)
  ON CONFLICT (user_id, action_type, window_start)
  DO UPDATE SET 
    action_count = public.engagement_rate_limits.action_count + 1,
    updated_at = NOW();

  -- Track IP if provided
  IF p_ip_address IS NOT NULL THEN
    INSERT INTO public.user_ip_tracking (user_id, ip_address, action_count)
    VALUES (p_user_id, p_ip_address, 1)
    ON CONFLICT (user_id, ip_address)
    DO UPDATE SET 
      last_seen = NOW(),
      action_count = public.user_ip_tracking.action_count + 1;
  END IF;

  -- Check for rapid engagement pattern (more than 20 actions in 1 minute)
  SELECT COUNT(*) INTO v_recent_actions
  FROM public.engagement_rate_limits
  WHERE user_id = p_user_id
    AND action_type = p_action_type
    AND updated_at > NOW() - INTERVAL '1 minute';

  IF v_recent_actions > 20 THEN
    INSERT INTO public.suspicious_activity_logs (
      user_id, activity_type, severity, details, ip_address, user_agent
    ) VALUES (
      p_user_id, 'rapid_engagement', 'high',
      jsonb_build_object('action_type', p_action_type, 'actions_per_minute', v_recent_actions),
      p_ip_address, p_user_agent
    );
  END IF;
END;
$$;

-- Function to detect bot patterns
CREATE OR REPLACE FUNCTION public.detect_bot_pattern(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_like_variance NUMERIC;
  v_comment_variance NUMERIC;
  v_timing_pattern BOOLEAN;
BEGIN
  -- Check for extremely consistent timing (possible bot)
  SELECT 
    STDDEV(EXTRACT(EPOCH FROM (created_at - LAG(created_at) OVER (ORDER BY created_at))))
  INTO v_like_variance
  FROM public.post_likes
  WHERE user_id = p_user_id
    AND created_at > NOW() - INTERVAL '1 hour';

  -- If variance is extremely low (actions at exact intervals), flag as bot
  IF v_like_variance IS NOT NULL AND v_like_variance < 2 THEN
    INSERT INTO public.suspicious_activity_logs (
      user_id, activity_type, severity, details
    ) VALUES (
      p_user_id, 'bot_pattern', 'critical',
      jsonb_build_object('timing_variance', v_like_variance, 'type', 'consistent_intervals')
    );
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- Enable RLS
ALTER TABLE public.engagement_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suspicious_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ip_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_restrictions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own rate limits"
  ON public.engagement_rate_limits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own restrictions"
  ON public.account_restrictions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all suspicious activity"
  ON public.suspicious_activity_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage restrictions"
  ON public.account_restrictions FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role full access to rate limits"
  ON public.engagement_rate_limits FOR ALL
  USING (((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'service_role'::text);

CREATE POLICY "Service role full access to activity logs"
  ON public.suspicious_activity_logs FOR ALL
  USING (((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'service_role'::text);

CREATE POLICY "Service role full access to IP tracking"
  ON public.user_ip_tracking FOR ALL
  USING (((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'service_role'::text);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_engagement_rate_limits_user_window ON public.engagement_rate_limits(user_id, action_type, window_start);
CREATE INDEX IF NOT EXISTS idx_suspicious_activity_user ON public.suspicious_activity_logs(user_id, flagged_at);
CREATE INDEX IF NOT EXISTS idx_suspicious_activity_reviewed ON public.suspicious_activity_logs(reviewed, severity);
CREATE INDEX IF NOT EXISTS idx_user_ip_tracking_ip ON public.user_ip_tracking(ip_address, last_seen);
CREATE INDEX IF NOT EXISTS idx_account_restrictions_active ON public.account_restrictions(user_id, is_active, restricted_until);

-- Auto-cleanup old rate limit data (keep last 7 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.engagement_rate_limits
  WHERE window_start < NOW() - INTERVAL '7 days';
END;
$$;

COMMENT ON TABLE public.engagement_rate_limits IS 'Tracks user engagement actions for rate limiting';
COMMENT ON TABLE public.suspicious_activity_logs IS 'Logs suspicious engagement patterns for fraud detection';
COMMENT ON TABLE public.user_ip_tracking IS 'Tracks IP addresses to detect multiple account abuse';
COMMENT ON TABLE public.account_restrictions IS 'Manages temporary restrictions on user accounts';
COMMENT ON FUNCTION public.can_perform_engagement IS 'Checks if user is allowed to perform engagement action';
COMMENT ON FUNCTION public.record_engagement_action IS 'Records engagement action and updates rate limits';
COMMENT ON FUNCTION public.detect_bot_pattern IS 'Detects bot-like engagement patterns';
