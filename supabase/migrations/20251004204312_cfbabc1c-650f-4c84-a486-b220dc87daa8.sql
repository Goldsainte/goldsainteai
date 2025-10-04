-- Add Stripe Connect fields to travel_agents table
ALTER TABLE public.travel_agents
ADD COLUMN IF NOT EXISTS stripe_account_id text,
ADD COLUMN IF NOT EXISTS stripe_account_status text DEFAULT 'not_connected',
ADD COLUMN IF NOT EXISTS stripe_onboarding_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_charges_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_payouts_enabled boolean DEFAULT false;

-- Add fee structure fields to agent_bids
ALTER TABLE public.agent_bids
ADD COLUMN IF NOT EXISTS agent_quoted_price numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS customer_facing_price numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS service_fee_percentage numeric DEFAULT 3.0,
ADD COLUMN IF NOT EXISTS success_fee_percentage numeric DEFAULT 15.0,
ADD COLUMN IF NOT EXISTS platform_service_fee numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS platform_success_fee numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS agent_payout_amount numeric DEFAULT 0;

-- Rename proposed_price to match new structure (keep for backwards compatibility)
-- proposed_price will now represent customer_facing_price

-- Add payment tracking to marketplace_jobs
ALTER TABLE public.marketplace_jobs
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid',
ADD COLUMN IF NOT EXISTS payment_intent_id text,
ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS total_paid_amount numeric,
ADD COLUMN IF NOT EXISTS service_fee_collected numeric,
ADD COLUMN IF NOT EXISTS success_fee_collected numeric,
ADD COLUMN IF NOT EXISTS agent_payout_amount numeric,
ADD COLUMN IF NOT EXISTS agent_payout_status text DEFAULT 'pending';

-- Create function to calculate pricing with fees
CREATE OR REPLACE FUNCTION calculate_bid_pricing(
  agent_price numeric,
  service_fee_pct numeric DEFAULT 3.0,
  success_fee_pct numeric DEFAULT 15.0
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  customer_price numeric;
  service_fee numeric;
  success_fee numeric;
  agent_payout numeric;
BEGIN
  -- Customer pays agent price + 3% service fee
  customer_price := agent_price * (1 + service_fee_pct / 100);
  
  -- Service fee is 3% of agent price
  service_fee := agent_price * (service_fee_pct / 100);
  
  -- Success fee is 15% of agent price
  success_fee := agent_price * (success_fee_pct / 100);
  
  -- Agent receives their price minus 15% success fee
  agent_payout := agent_price - success_fee;
  
  RETURN jsonb_build_object(
    'customer_facing_price', customer_price,
    'service_fee', service_fee,
    'success_fee', success_fee,
    'agent_payout', agent_payout
  );
END;
$$;

COMMENT ON FUNCTION calculate_bid_pricing IS 'Calculates all pricing components: customer price includes 3% markup, agent receives their quote minus 15% success fee';