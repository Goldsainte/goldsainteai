-- Drop the problematic oauth_states table to force schema cache refresh
DROP TABLE IF EXISTS public.oauth_states CASCADE;

-- Recreate with correct column name (platform, not provider)
CREATE TABLE IF NOT EXISTS public.oauth_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state text UNIQUE NOT NULL,
  platform text NOT NULL,
  app_origin text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_oauth_states_state ON public.oauth_states(state);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires ON public.oauth_states(expires_at);

-- Enable RLS (service role bypasses this)
ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;

-- Cleanup function for expired states
CREATE OR REPLACE FUNCTION public.cleanup_expired_oauth_states()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.oauth_states
  WHERE expires_at < now();
END;
$$;
