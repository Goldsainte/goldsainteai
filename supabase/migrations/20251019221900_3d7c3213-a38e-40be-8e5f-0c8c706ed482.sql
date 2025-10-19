-- Force aggressive schema cache reload for oauth_states table
-- Adding and dropping a column triggers immediate cache invalidation in PostgREST

ALTER TABLE public.oauth_states ADD COLUMN IF NOT EXISTS _cache_bust_temp TEXT DEFAULT NULL;
ALTER TABLE public.oauth_states DROP COLUMN IF EXISTS _cache_bust_temp;

-- Verify the correct schema exists
DO $$
BEGIN
  -- Ensure platform column exists (not provider)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'oauth_states' 
      AND column_name = 'platform'
  ) THEN
    RAISE EXCEPTION 'oauth_states.platform column is missing - schema cache issue persists';
  END IF;
END $$;