-- Ensure oauth_states table exists with correct schema
CREATE TABLE IF NOT EXISTS public.oauth_states (
  state TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  app_origin TEXT
);

-- Add app_origin column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'oauth_states' 
    AND column_name = 'app_origin'
  ) THEN
    ALTER TABLE public.oauth_states ADD COLUMN app_origin TEXT;
  END IF;
END $$;

-- Create indexes for performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_oauth_states_state ON public.oauth_states(state);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires_at ON public.oauth_states(expires_at);

-- Enable RLS
ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Service role can manage oauth states" ON public.oauth_states;

-- Service role can manage states
CREATE POLICY "Service role can manage oauth states"
ON public.oauth_states
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);