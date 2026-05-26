-- CREATE TABLE IF NOT EXISTS for storing Instagram access tokens
CREATE TABLE IF NOT EXISTS public.instagram_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  instagram_user_id TEXT NOT NULL,
  username TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.instagram_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own Instagram tokens"
  ON public.instagram_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Instagram tokens"
  ON public.instagram_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Instagram tokens"
  ON public.instagram_tokens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Instagram tokens"
  ON public.instagram_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_instagram_tokens_updated_at
  BEFORE UPDATE ON public.instagram_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();