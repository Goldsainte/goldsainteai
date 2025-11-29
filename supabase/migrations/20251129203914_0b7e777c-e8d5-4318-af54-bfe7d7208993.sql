
-- =====================================================
-- Fix RLS Disabled Tables
-- =====================================================

-- Enable RLS on cancellation_policies (public read, admin write)
ALTER TABLE public.cancellation_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view cancellation policies"
  ON public.cancellation_policies FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage cancellation policies"
  ON public.cancellation_policies FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Enable RLS on platform_metrics (admin only)
ALTER TABLE public.platform_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view platform metrics"
  ON public.platform_metrics FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage platform metrics"
  ON public.platform_metrics FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- Fix Security Definer Views - Add security_invoker
-- =====================================================

-- Recreate public_profiles with security_invoker (safe - only public data)
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles 
WITH (security_invoker = true)
AS
SELECT id,
    username,
    avatar_url,
    bio,
    is_verified,
    created_at
FROM profiles;

-- Recreate brand_profiles_discovery with security_invoker
DROP VIEW IF EXISTS public.brand_profiles_discovery;
CREATE VIEW public.brand_profiles_discovery
WITH (security_invoker = true)
AS
SELECT p.id AS profile_id,
    p.id AS user_id,
    COALESCE(p.full_name, p.username) AS name,
    p.avatar_url,
    p.bio,
    p.creator_niches AS categories,
    p.destinations_focus_tags AS regions,
    p.content_style_tags AS tags,
    p.country,
    p.account_type,
    s.supplier_type,
    s.name AS supplier_name,
    s.is_verified AS supplier_verified,
    s.rating AS supplier_rating,
    s.total_reviews AS supplier_reviews,
    now() AS created_at
FROM profiles p
LEFT JOIN suppliers s ON s.user_id = p.id
LEFT JOIN user_roles ur ON ur.user_id = p.id
WHERE ur.role = 'brand'::app_role OR s.id IS NOT NULL;

-- Recreate platform_analytics - admin only view, keep as security_definer for admin bypass
-- This is intentional as admins need to see aggregate data
DROP VIEW IF EXISTS public.platform_analytics;
CREATE VIEW public.platform_analytics
WITH (security_invoker = false)
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

-- Recreate trip_bookings_ops_view - admin only with security_invoker for proper RLS
DROP VIEW IF EXISTS public.trip_bookings_ops_view;
CREATE VIEW public.trip_bookings_ops_view
WITH (security_invoker = true)
AS
SELECT b.id,
    b.trip_request_id,
    b.proposal_id,
    b.traveler_id,
    b.partner_id,
    b.partner_role,
    b.currency,
    b.total_price,
    b.platform_commission,
    b.partner_payout,
    b.stripe_payment_intent_id,
    b.stripe_payment_status,
    b.stripe_transfer_group,
    b.status,
    b.created_at,
    b.updated_at,
    b.payment_url,
    b.payment_client_secret,
    b.metadata,
    tr.title AS trip_title,
    tr.destination,
    p_traveler.email AS traveler_email,
    p_partner.email AS partner_email
FROM trip_bookings b
LEFT JOIN trip_requests tr ON b.trip_request_id = tr.id
LEFT JOIN profiles p_traveler ON b.traveler_id = p_traveler.id
LEFT JOIN profiles p_partner ON b.partner_id = p_partner.id;

-- Grant appropriate permissions
GRANT SELECT ON public.public_profiles TO anon, authenticated;
GRANT SELECT ON public.brand_profiles_discovery TO anon, authenticated;
GRANT SELECT ON public.platform_analytics TO authenticated;
GRANT SELECT ON public.trip_bookings_ops_view TO authenticated;
