-- CREATE TABLE IF NOT EXISTS for Apple Music API credentials
CREATE TABLE IF NOT EXISTS public.apple_music_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  p8_key TEXT NOT NULL,
  key_id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.apple_music_credentials ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own credentials
CREATE POLICY "Users can insert own credentials"
  ON public.apple_music_credentials
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own credentials
CREATE POLICY "Users can view own credentials"
  ON public.apple_music_credentials
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can update their own credentials
CREATE POLICY "Users can update own credentials"
  ON public.apple_music_credentials
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Allow service role to read all credentials (for edge functions)
CREATE POLICY "Service role can read all credentials"
  ON public.apple_music_credentials
  FOR SELECT
  TO service_role
  USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_apple_music_credentials_updated_at
  BEFORE UPDATE ON public.apple_music_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();