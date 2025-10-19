-- Force PostgREST to reload schema cache
-- Using NOTIFY signal

NOTIFY pgrst, 'reload schema';

-- Also add a simple comment to trigger change detection
COMMENT ON TABLE public.oauth_states IS 'OAuth state storage for Apple and Google Sign-In';