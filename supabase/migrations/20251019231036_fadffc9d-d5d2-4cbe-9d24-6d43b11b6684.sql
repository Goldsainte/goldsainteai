-- Make user_id nullable to support OAuth flows for new users
ALTER TABLE public.oauth_states ALTER COLUMN user_id DROP NOT NULL;

-- Drop existing platform check constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'oauth_states_platform_check'
  ) THEN
    ALTER TABLE public.oauth_states DROP CONSTRAINT oauth_states_platform_check;
  END IF;
END $$;

-- Add updated platform check constraint that includes 'apple'
ALTER TABLE public.oauth_states
  ADD CONSTRAINT oauth_states_platform_check
  CHECK (platform IN ('apple', 'shopify', 'etsy', 'instagram'));

-- Ensure indexes exist for performance (will be no-op if already present)
CREATE INDEX IF NOT EXISTS idx_oauth_states_state ON public.oauth_states(state);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires_at ON public.oauth_states(expires_at);