-- Phase 1: Emergency Signup Fix
-- Drop problematic CHECK constraint on profiles.role
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Make profiles.role nullable and remove default
ALTER TABLE public.profiles 
  ALTER COLUMN role DROP DEFAULT,
  ALTER COLUMN role DROP NOT NULL;

-- Update handle_new_user() trigger to NOT set role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, account_type)
  VALUES (new.id, 'personal')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- Phase 3: Add deprecation comment
COMMENT ON COLUMN public.profiles.role IS 
  'DEPRECATED: Use user_roles table instead. This column will be removed in a future migration. All role checks should use the user_roles table and has_role() function.';