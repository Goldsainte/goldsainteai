-- Add core profile fields for account type and completeness
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS account_type text
    CHECK (account_type IN ('traveler', 'creator', 'agent')),
  ADD COLUMN IF NOT EXISTS is_profile_complete boolean DEFAULT false;