-- Create brand_profiles table for brand-specific data
CREATE TABLE IF NOT EXISTS public.brand_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL,
  website TEXT,
  brand_type TEXT,
  regions TEXT[],
  style_tags TEXT[],
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(owner_user_id)
);

-- RLS policies for brand_profiles
ALTER TABLE public.brand_profiles ENABLE ROW LEVEL SECURITY;

-- Brand owners can view and edit their own profile
CREATE POLICY "Brand owners can view own profile"
  ON public.brand_profiles FOR SELECT
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Brand owners can update own profile"
  ON public.brand_profiles FOR UPDATE
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Brand owners can insert own profile"
  ON public.brand_profiles FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

-- Public can view verified brand profiles
CREATE POLICY "Public can view verified brands"
  ON public.brand_profiles FOR SELECT
  USING (verification_status = 'verified');

-- Admins can view all brand profiles
CREATE POLICY "Admins can view all brand profiles"
  ON public.brand_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_brand_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_brand_profiles_updated_at
  BEFORE UPDATE ON public.brand_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_brand_profiles_updated_at();

-- CREATE INDEX IF NOT EXISTS for faster lookups
CREATE INDEX IF NOT EXISTS idx_brand_profiles_owner ON public.brand_profiles(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_brand_profiles_verification ON public.brand_profiles(verification_status);
