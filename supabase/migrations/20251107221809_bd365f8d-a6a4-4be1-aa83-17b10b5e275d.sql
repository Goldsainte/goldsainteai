-- Add preferred_language column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'es', 'fr', 'de', 'it', 'pt'));

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.preferred_language IS 'User''s preferred interface language (en, es, fr, de, it, pt)';

-- CREATE INDEX IF NOT EXISTS for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_language ON public.profiles(preferred_language);
