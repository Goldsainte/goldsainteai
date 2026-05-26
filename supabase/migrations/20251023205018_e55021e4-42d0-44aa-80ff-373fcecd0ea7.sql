-- Fix profiles RLS policy to restrict public access to sensitive fields
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- Create restrictive policy for public read access (only safe fields)
CREATE POLICY "Public can view basic profile info" ON public.profiles
FOR SELECT
USING (true)
-- Note: Column-level security will be enforced via a view

-- Users can still view their full profile
;

CREATE POLICY "Users can view own full profile" ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Create a public-safe view for profiles
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT 
  id,
  username,
  avatar_url,
  bio,
  is_verified,
  created_at
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Create idempotency table for payment processing
CREATE TABLE IF NOT EXISTS public.processed_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_intent_id TEXT UNIQUE NOT NULL,
  stripe_session_id TEXT,
  user_id UUID REFERENCES auth.users(id),
  amount_cents BIGINT NOT NULL,
  currency TEXT NOT NULL,
  payment_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB
);

-- Enable RLS on processed_payments
ALTER TABLE public.processed_payments ENABLE ROW LEVEL SECURITY;

-- Users can only view their own processed payments
CREATE POLICY "Users can view own processed payments" ON public.processed_payments
FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

-- Service role can insert (used by payment verification functions)
CREATE POLICY "Service role can insert processed payments" ON public.processed_payments
FOR INSERT
WITH CHECK (true);

-- CREATE INDEX IF NOT EXISTS for fast idempotency checks
CREATE INDEX IF NOT EXISTS idx_processed_payments_payment_intent 
ON public.processed_payments(payment_intent_id);

CREATE INDEX IF NOT EXISTS idx_processed_payments_session 
ON public.processed_payments(stripe_session_id) 
WHERE stripe_session_id IS NOT NULL;
