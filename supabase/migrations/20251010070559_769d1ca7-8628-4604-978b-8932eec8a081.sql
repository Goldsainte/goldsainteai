-- Add Stripe Connect fields to travel_agents table for daily payouts
ALTER TABLE public.travel_agents
ADD COLUMN IF NOT EXISTS payout_schedule TEXT DEFAULT 'daily';

-- Update marketplace_jobs to track payment details
ALTER TABLE public.marketplace_jobs
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_transfer_id TEXT,
ADD COLUMN IF NOT EXISTS payment_captured_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payout_processed_at TIMESTAMP WITH TIME ZONE;

-- Update marketplace_invoices to track Stripe transfers
ALTER TABLE public.marketplace_invoices
ADD COLUMN IF NOT EXISTS stripe_transfer_id TEXT,
ADD COLUMN IF NOT EXISTS transfer_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS platform_fee NUMERIC DEFAULT 0;

-- CREATE INDEX IF NOT EXISTS for faster payment lookups
CREATE INDEX IF NOT EXISTS idx_marketplace_jobs_payment ON public.marketplace_jobs(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_jobs_agent_payout ON public.marketplace_jobs(assigned_agent_id, payout_processed_at);
