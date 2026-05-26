-- CREATE TABLE IF NOT EXISTS for Apple Sign-In credentials
CREATE TABLE IF NOT EXISTS public.apple_signin_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  p8_key TEXT NOT NULL,
  key_id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  services_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.apple_signin_credentials ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own Apple Sign-In credentials"
  ON public.apple_signin_credentials
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Apple Sign-In credentials"
  ON public.apple_signin_credentials
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Apple Sign-In credentials"
  ON public.apple_signin_credentials
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Apple Sign-In credentials"
  ON public.apple_signin_credentials
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_apple_signin_credentials_updated_at
  BEFORE UPDATE ON public.apple_signin_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();