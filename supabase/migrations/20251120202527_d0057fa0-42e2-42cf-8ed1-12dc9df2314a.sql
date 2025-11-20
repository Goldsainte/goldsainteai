-- Add missing fields to brand_profiles table
ALTER TABLE public.brand_profiles
ADD COLUMN IF NOT EXISTS tagline TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

COMMENT ON COLUMN public.brand_profiles.tagline IS 'One-line brand tagline';
COMMENT ON COLUMN public.brand_profiles.bio IS 'Short brand story for travelers';