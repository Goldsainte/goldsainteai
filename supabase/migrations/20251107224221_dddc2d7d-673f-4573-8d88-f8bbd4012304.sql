
-- Drop the insecure view that exposes auth.users
DROP VIEW IF EXISTS public.platform_analytics;

-- Create a secure function to get user count (SECURITY DEFINER with proper restrictions)
CREATE OR REPLACE FUNCTION public.get_total_users_count()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*) FROM auth.users;
$$;

-- Create a secure view using the function instead of direct auth.users access
CREATE OR REPLACE VIEW public.platform_analytics AS
SELECT 
  public.get_total_users_count() AS total_users,
  (SELECT COUNT(*) FROM public.travel_agents WHERE is_verified = true) AS verified_agents,
  (SELECT COUNT(*) FROM public.travel_agents WHERE is_active = true) AS active_agents,
  (SELECT COUNT(*) FROM public.marketplace_jobs) AS total_jobs,
  (SELECT COUNT(*) FROM public.marketplace_jobs WHERE status = 'open') AS open_jobs,
  (SELECT COUNT(*) FROM public.marketplace_jobs WHERE status = 'in_progress') AS in_progress_jobs,
  (SELECT COUNT(*) FROM public.marketplace_jobs WHERE status = 'completed') AS completed_jobs,
  (SELECT COALESCE(SUM(agent_payout_amount), 0) FROM public.marketplace_jobs WHERE status = 'completed') AS total_agent_payouts,
  (SELECT COALESCE(SUM(service_fee_collected), 0) FROM public.marketplace_jobs WHERE status = 'completed') AS total_service_fees,
  (SELECT COALESCE(SUM(success_fee_collected), 0) FROM public.marketplace_jobs WHERE status = 'completed') AS total_success_fees,
  (SELECT COUNT(*) FROM public.agent_reviews) AS total_reviews,
  (SELECT COALESCE(AVG(rating), 0) FROM public.agent_reviews) AS average_rating,
  (SELECT COUNT(*) FROM public.user_reports WHERE status = 'pending') AS pending_reports,
  (SELECT COUNT(*) FROM public.marketplace_disputes WHERE status = 'open') AS open_disputes;

-- Enable RLS on the view would require making it a materialized view or table
-- Instead, we'll restrict function access
REVOKE ALL ON FUNCTION public.get_total_users_count() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_total_users_count() FROM anon;
REVOKE ALL ON FUNCTION public.get_total_users_count() FROM authenticated;

-- Only allow admins to execute this function
GRANT EXECUTE ON FUNCTION public.get_total_users_count() TO service_role;

-- Create a helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
$$;

-- Grant limited access to platform_analytics only for admins
-- Note: Views don't support RLS directly, so access should be controlled at application level
COMMENT ON VIEW public.platform_analytics IS 'Admin-only analytics view. Application must verify admin role before querying.';
