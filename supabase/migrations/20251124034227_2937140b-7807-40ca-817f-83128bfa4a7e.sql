-- Remove old banking fields from agent_applications
ALTER TABLE agent_applications 
DROP COLUMN IF EXISTS bank_name,
DROP COLUMN IF EXISTS account_holder_name,
DROP COLUMN IF EXISTS account_type,
DROP COLUMN IF EXISTS routing_number,
DROP COLUMN IF EXISTS account_number_last4;

-- Add Stripe Connect tracking fields to agent_applications
ALTER TABLE agent_applications 
ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_connect_onboarding_url TEXT,
ADD COLUMN IF NOT EXISTS stripe_connect_onboarding_complete BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_connect_charges_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_connect_payouts_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_connect_created_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stripe_connect_last_updated TIMESTAMPTZ;

-- CREATE INDEX IF NOT EXISTS for efficient lookups
CREATE INDEX IF NOT EXISTS idx_agent_applications_stripe_account 
ON agent_applications(stripe_connect_account_id) WHERE stripe_connect_account_id IS NOT NULL;

-- Ensure profiles table has Stripe Connect fields (already exists but add IF NOT EXISTS)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_connect_payouts_enabled BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_account 
ON profiles(stripe_connect_account_id) WHERE stripe_connect_account_id IS NOT NULL;
