-- Ensure profiles table has proper columns for account type flow
-- Add is_profile_complete if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'profiles' 
                 AND column_name = 'is_profile_complete') THEN
    ALTER TABLE public.profiles ADD COLUMN is_profile_complete BOOLEAN DEFAULT false;
  END IF;
END $$;

-- First, update any invalid account types to NULL
UPDATE public.profiles 
SET account_type = NULL, is_profile_complete = false 
WHERE account_type NOT IN ('traveler', 'creator', 'agent') OR account_type IS NULL;

-- Now drop the old constraint if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'profiles_account_type_check' 
             AND table_name = 'profiles') THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_account_type_check;
  END IF;
END $$;

-- Add new constraint with proper values (allowing NULL for incomplete profiles)
ALTER TABLE public.profiles ADD CONSTRAINT profiles_account_type_check 
  CHECK (account_type IS NULL OR account_type IN ('traveler', 'creator', 'agent'));