-- Create creator_profiles table
CREATE TABLE IF NOT EXISTS public.creator_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  handle text UNIQUE,
  avatar_url text,
  bio text,
  primary_niches text[],
  primary_regions text[],
  tiktok_handle text,
  tiktok_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Creators can manage their own profile
CREATE POLICY "Creators can manage their own profile"
ON public.creator_profiles
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Anyone can view creator profiles (for public pages)
CREATE POLICY "Anyone can view creator profiles"
ON public.creator_profiles
FOR SELECT
USING (true);

-- Add updated_at trigger
CREATE TRIGGER handle_creator_profiles_updated_at 
BEFORE UPDATE ON public.creator_profiles
FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_creator_profiles_handle ON public.creator_profiles(handle);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_tiktok_handle ON public.creator_profiles(tiktok_handle);
