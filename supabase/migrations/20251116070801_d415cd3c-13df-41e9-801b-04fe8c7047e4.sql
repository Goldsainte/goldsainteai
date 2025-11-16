-- Drop the old constraint if it exists
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_account_type_check;

-- Add a new constraint that allows all currently used and planned account types
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_account_type_check
CHECK (account_type IN ('personal', 'traveler', 'creator', 'agent', 'admin', 'business', 'partner'));

-- Update any NULL account_type values to 'personal' (the current default)
UPDATE public.profiles
SET account_type = 'personal'
WHERE account_type IS NULL;

-- Make sure account_type has a default
ALTER TABLE public.profiles
ALTER COLUMN account_type SET DEFAULT 'personal';