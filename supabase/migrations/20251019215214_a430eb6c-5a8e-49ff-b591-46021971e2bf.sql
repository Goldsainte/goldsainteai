-- Force schema cache reload by adding a comment to trigger PostgREST refresh
COMMENT ON TABLE public.oauth_states IS 'OAuth state storage for third-party authentication flows - Updated 2025-10-19';

-- Verify the platform column exists (this is just a check, not a modification)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'oauth_states' 
    AND column_name = 'platform'
  ) THEN
    RAISE EXCEPTION 'platform column does not exist in oauth_states table';
  END IF;
END $$;