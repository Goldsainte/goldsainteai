
-- Fix platform_analytics view to use security_invoker (admins will still need to check via RLS on base tables)
DROP VIEW IF EXISTS public.platform_analytics;
CREATE VIEW public.platform_analytics
WITH (security_invoker = true)
AS
SELECT count(DISTINCT p.id) FILTER (WHERE p.account_type = 'traveler') AS total_travelers,
    count(DISTINCT p.id) FILTER (WHERE p.account_type = 'creator') AS total_creators,
    count(DISTINCT p.id) FILTER (WHERE p.account_type = 'agent') AS total_agents,
    count(DISTINCT tr.id) AS total_trip_requests,
    count(DISTINCT tp.id) AS total_proposals,
    count(DISTINCT b.id) AS total_bookings,
    COALESCE(sum(b.total_price), 0) AS total_booking_value
FROM profiles p
CROSS JOIN trip_requests tr
CROSS JOIN trip_proposals tp
CROSS JOIN trip_bookings b;

GRANT SELECT ON public.platform_analytics TO authenticated;

-- Revoke access to materialized view from anon to reduce API exposure
REVOKE ALL ON public.agent_leaderboard FROM anon;
GRANT SELECT ON public.agent_leaderboard TO authenticated;
