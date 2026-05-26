-- Create enum for user subscription tiers
CREATE TYPE public.subscription_tier AS ENUM ('free', 'premium', 'enterprise');

-- Create user_subscriptions table to track subscription levels
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  tier subscription_tier NOT NULL DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view their own subscription"
ON public.user_subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Service role can do everything (for edge functions)
CREATE POLICY "Service role has full access"
ON public.user_subscriptions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Function to get user's subscription tier (security definer to bypass RLS)
CREATE OR REPLACE FUNCTION public.get_user_tier(_user_id UUID)
RETURNS subscription_tier
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT tier FROM public.user_subscriptions WHERE user_id = _user_id),
    'free'::subscription_tier
  );
$$;

-- Trigger to automatically create free tier subscription on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, tier)
  VALUES (NEW.id, 'free'::subscription_tier)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_subscription();