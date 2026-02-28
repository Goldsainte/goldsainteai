
-- Backfill existing users' emails from auth.users into profiles
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');

-- Update handle_new_user() to include email for future signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    display_name,
    first_name,
    last_name,
    phone,
    account_type,
    sms_notifications,
    is_profile_complete,
    onboarding_completed,
    email
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'display_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
      ''
    ),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'phone', ''), ''),
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'traveler'),
    COALESCE((NEW.raw_user_meta_data->>'sms_notifications')::boolean, false),
    false,
    false,
    COALESCE(NEW.email, '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(NULLIF(EXCLUDED.email, ''), profiles.email);

  RETURN NEW;
END;
$function$;
