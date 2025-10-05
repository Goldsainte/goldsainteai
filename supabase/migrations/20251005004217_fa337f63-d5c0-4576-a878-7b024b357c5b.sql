-- Fix function security: Set search_path for all functions

-- Fix expire_old_marketplace_jobs function
CREATE OR REPLACE FUNCTION public.expire_old_marketplace_jobs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.marketplace_jobs
  SET status = 'expired'
  WHERE status = 'open'
    AND expires_at < NOW();
END;
$function$;

-- Fix calculate_agent_trust_score function
CREATE OR REPLACE FUNCTION public.calculate_agent_trust_score(agent_uuid uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  score numeric := 0;
BEGIN
  -- Base score from verifications (max 3.0)
  SELECT 
    CASE WHEN identity_verified THEN 0.75 ELSE 0 END +
    CASE WHEN background_check_status = 'approved' THEN 0.75 ELSE 0 END +
    CASE WHEN professional_license_verified THEN 0.75 ELSE 0 END +
    CASE WHEN insurance_verified THEN 0.75 ELSE 0 END
  INTO score
  FROM public.travel_agents
  WHERE id = agent_uuid;
  
  -- Add rating score (max 2.0)
  SELECT score + COALESCE((rating / 5.0 * 2.0), 0)
  INTO score
  FROM public.travel_agents
  WHERE id = agent_uuid;
  
  RETURN LEAST(score, 5.0);
END;
$function$;