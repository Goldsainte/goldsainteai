-- Part 1: Fix handle_new_user() trigger to use NULLIF for phone
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    first_name,
    last_name,
    phone,
    account_type,
    sms_notifications,
    is_profile_complete,
    onboarding_completed
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'phone', ''), ''),
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'traveler'),
    COALESCE((NEW.raw_user_meta_data->>'sms_notifications')::boolean, false),
    false,
    false
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Part 2: Clean up existing empty phone values
UPDATE profiles SET phone = NULL WHERE phone = '';