-- Add missing onboarding columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS primary_platform text;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS profiles_display_name_idx ON public.profiles(display_name) WHERE display_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role) WHERE role IS NOT NULL;
CREATE INDEX IF NOT EXISTS profiles_onboarding_idx ON public.profiles(onboarding_completed, role);

-- Ensure RLS policy exists for profile updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile" ON public.profiles
      FOR UPDATE USING (auth.uid() = id);
  END IF;
END
$$;