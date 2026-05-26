-- Ensure oauth_states table has both platform and provider columns for backward compatibility
ALTER TABLE public.oauth_states ADD COLUMN IF NOT EXISTS provider TEXT;

-- CREATE INDEX IF NOT EXISTS on state for faster lookups
CREATE INDEX IF NOT EXISTS idx_oauth_states_state ON public.oauth_states(state);

-- CREATE INDEX IF NOT EXISTS on expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires_at ON public.oauth_states(expires_at);
