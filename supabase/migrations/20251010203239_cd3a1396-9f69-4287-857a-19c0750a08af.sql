-- Create promoted posts table
CREATE TABLE IF NOT EXISTS public.promoted_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.travel_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  plan_id TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  duration_days INTEGER NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  reach_estimate TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promoted_posts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view active promoted posts"
  ON public.promoted_posts
  FOR SELECT
  USING (status = 'active' AND expires_at > now());

CREATE POLICY "Users can view their own promoted posts"
  ON public.promoted_posts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage promoted posts"
  ON public.promoted_posts
  FOR ALL
  USING ((current_setting('request.jwt.claims', true)::json->>'role')::text = 'service_role');

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_promoted_posts_active ON public.promoted_posts(status, expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_promoted_posts_user ON public.promoted_posts(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_promoted_posts_updated_at
  BEFORE UPDATE ON public.promoted_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
