CREATE OR REPLACE FUNCTION public.calculate_bid_pricing(
  agent_price numeric,
  service_fee_pct numeric DEFAULT 3.5,
  success_fee_pct numeric DEFAULT 3.5
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  customer_price numeric;
  service_fee numeric;
  success_fee numeric;
  agent_payout numeric;
BEGIN
  -- Customer pays agent price + service fee
  customer_price := agent_price * (1 + service_fee_pct / 100);
  
  -- Service fee (guest side)
  service_fee := agent_price * (service_fee_pct / 100);
  
  -- Success fee (host side)
  success_fee := agent_price * (success_fee_pct / 100);
  
  -- Agent receives their price minus host-side fee
  agent_payout := agent_price - success_fee;
  
  RETURN jsonb_build_object(
    'customer_facing_price', customer_price,
    'service_fee', service_fee,
    'success_fee', success_fee,
    'agent_payout', agent_payout
  );
END;
$function$;