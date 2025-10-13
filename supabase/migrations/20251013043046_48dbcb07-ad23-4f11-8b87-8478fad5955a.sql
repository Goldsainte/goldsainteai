-- Add unique constraints to prevent duplicate usernames and phone numbers
-- Note: Email uniqueness is already enforced by auth.users table
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_username_unique UNIQUE (username);

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_phone_unique UNIQUE (phone);