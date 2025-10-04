-- Fix security: Set search_path for calculate_bid_pricing function
CREATE OR REPLACE FUNCTION calculate_bid_pricing(
  agent_price numeric,
  service_fee_pct numeric DEFAULT 3.0,
  success_fee_pct numeric DEFAULT 15.0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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