-- Create oauth_states table for temporary OAuth state storage
CREATE TABLE IF NOT EXISTS public.oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('shopify', 'etsy', 'instagram')),
  store_url TEXT,
  code_verifier TEXT, -- For PKCE (Etsy)
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_oauth_states_state ON public.oauth_states(state);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires ON public.oauth_states(expires_at);

-- RLS policies
ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage oauth states" ON public.oauth_states
  FOR ALL USING (
    ((current_setting('request.jwt.claims', true)::json->>'role')::text = 'service_role')
  );

-- Auto-cleanup expired states
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
