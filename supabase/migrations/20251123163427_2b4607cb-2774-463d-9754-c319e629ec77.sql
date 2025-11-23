-- Fix the handle_new_user trigger to use NULL instead of 'personal'
-- This resolves the "Database error saving new user" by respecting the CHECK constraint
-- on profiles.account_type which only allows NULL, 'traveler', 'creator', or 'agent'

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id,
    account_type,
    is_profile_complete,
    onboarding_completed
  )
  VALUES (
    new.id,
    NULL,  -- Changed from 'personal' to NULL - will be set during onboarding
    false,
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$function$;