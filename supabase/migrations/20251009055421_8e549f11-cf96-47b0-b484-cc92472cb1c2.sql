-- Add is_verified column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Create verification_subscriptions table to track Stripe subscriptions
CREATE TABLE IF NOT EXISTS public.verification_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.verification_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own verification subscription
CREATE POLICY "Users can view own verification subscription"
ON public.verification_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Service role can manage all verification subscriptions
CREATE POLICY "Service role can manage verification subscriptions"
ON public.verification_subscriptions
FOR ALL
USING (
  (current_setting('request.jwt.claims'::text, true)::json ->> 'role'::text) = 'service_role'::text
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_verification_subscriptions_user_id 
ON public.verification_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_verification_subscriptions_stripe_customer 
ON public.verification_subscriptions(stripe_customer_id);

-- Add trigger to update updated_at
CREATE TRIGGER update_verification_subscriptions_updated_at
  BEFORE UPDATE ON public.verification_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();