
-- Fix search_path for functions that don't have it set
-- This prevents SQL injection through search_path manipulation

-- Update functions missing search_path
ALTER FUNCTION public.cleanup_expired_cache() SET search_path = public;
ALTER FUNCTION public.update_ecommerce_connections_updated_at() SET search_path = public;
ALTER FUNCTION public.validate_volume_range() SET search_path = public;
ALTER FUNCTION public.cleanup_expired_oauth_states() SET search_path = public;

-- These functions already have search_path set correctly, no changes needed:
-- handle_updated_at, update_visa_requests_updated_at, assign_agent_role,
-- get_user_tier, update_post_like_count, handle_new_user, has_role,
-- update_post_comment_count, update_booking_preferences_updated_at,
-- handle_new_user_subscription, calculate_creator_earnings, generate_invoice_number,
-- and many others already have 'SET search_path TO public' or 'SET search_path = public'

COMMENT ON FUNCTION public.cleanup_expired_cache IS 'Removes expired search cache entries. Protected against SQL injection with search_path.';
COMMENT ON FUNCTION public.cleanup_expired_oauth_states IS 'Removes expired OAuth states. Protected against SQL injection with search_path.';
