-- Add Stripe Connect fields to profiles for creators
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_account_status TEXT DEFAULT 'not_connected',
ADD COLUMN IF NOT EXISTS stripe_onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payout_schedule TEXT DEFAULT 'daily';

-- Update creator_earnings to track Stripe transfer info
ALTER TABLE public.creator_earnings
ADD COLUMN IF NOT EXISTS stripe_transfer_id TEXT,
ADD COLUMN IF NOT EXISTS transfer_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS platform_fee NUMERIC DEFAULT 0;

-- Update gift_transactions to track Stripe payment info
ALTER TABLE public.gift_transactions
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_transfer_id TEXT,
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE;

-- CREATE INDEX IF NOT EXISTS for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_account ON public.profiles(stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_creator_earnings_status ON public.creator_earnings(status, user_id);
CREATE INDEX IF NOT EXISTS idx_gift_transactions_processed ON public.gift_transactions(processed_at);
