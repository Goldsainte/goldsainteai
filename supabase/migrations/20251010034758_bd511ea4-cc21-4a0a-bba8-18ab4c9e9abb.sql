-- Add instagram_username to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS instagram_username text;

-- CREATE INDEX IF NOT EXISTS for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_instagram_username ON public.profiles(instagram_username);
