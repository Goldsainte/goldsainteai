-- Add stripe_verification_session_id column to customer_verifications table
ALTER TABLE public.customer_verifications 
ADD COLUMN IF NOT EXISTS stripe_verification_session_id TEXT UNIQUE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customer_verifications_stripe_session 
ON public.customer_verifications(stripe_verification_session_id) 
WHERE stripe_verification_session_id IS NOT NULL;