-- CREATE TABLE IF NOT EXISTS for Facebook OAuth credentials
CREATE TABLE IF NOT EXISTS public.facebook_signin_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id TEXT NOT NULL,
  app_secret TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.facebook_signin_credentials ENABLE ROW LEVEL SECURITY;

-- Only admins can manage Facebook credentials
CREATE POLICY "Only admins can manage Facebook credentials"
  ON public.facebook_signin_credentials
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );