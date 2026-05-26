-- Create AI usage tracking table
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  success BOOLEAN DEFAULT true,
  error_message TEXT
);

-- CREATE INDEX IF NOT EXISTS for faster queries
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_date ON public.ai_usage_logs(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own AI usage"
  ON public.ai_usage_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert AI usage logs"
  ON public.ai_usage_logs FOR INSERT
  WITH CHECK (true);

-- Add subscription tier to profiles if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'ai_subscription_tier') THEN
    ALTER TABLE public.profiles ADD COLUMN ai_subscription_tier TEXT DEFAULT 'free';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'ai_calls_used') THEN
    ALTER TABLE public.profiles ADD COLUMN ai_calls_used INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'ai_calls_reset_at') THEN
    ALTER TABLE public.profiles ADD COLUMN ai_calls_reset_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- Function to get user's AI usage count for current period
CREATE OR REPLACE FUNCTION get_user_ai_usage_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
  v_reset_at TIMESTAMPTZ;
BEGIN
  SELECT ai_calls_reset_at INTO v_reset_at
  FROM public.profiles
  WHERE user_id = p_user_id;
  
  -- If reset date is in the past, return 0
  IF v_reset_at < now() THEN
    RETURN 0;
  END IF;
  
  SELECT COUNT(*) INTO v_count
  FROM public.ai_usage_logs
  WHERE user_id = p_user_id
    AND created_at >= v_reset_at;
    
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
