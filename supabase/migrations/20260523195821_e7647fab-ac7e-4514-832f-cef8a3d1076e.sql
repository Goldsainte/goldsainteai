CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  v_full_name text;
  v_username text;
  v_base_username text;
  v_suffix int := 0;
  v_email text;
BEGIN
  v_email := NEW.email;
  v_full_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'name', ''),
    ''
  );

  IF v_email IS NOT NULL AND v_email <> '' THEN
    v_base_username := lower(regexp_replace(split_part(v_email, '@', 1), '[^a-z0-9]', '', 'g'));
  ELSE
    v_base_username := 'user' || substring(NEW.id::text, 1, 8);
  END IF;
  v_base_username := substring(COALESCE(NULLIF(v_base_username, ''), 'user'), 1, 25);
  v_username := v_base_username;

  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username) OR
        EXISTS (SELECT 1 FROM public.reserved_usernames WHERE username = v_username) LOOP
    v_suffix := v_suffix + 1;
    v_username := v_base_username || v_suffix::text;
  END LOOP;

  INSERT INTO public.profiles (
    id, username, full_name, display_name, first_name, last_name, phone,
    account_type, sms_notifications, is_profile_complete, onboarding_completed, email
  ) VALUES (
    NEW.id,
    v_username,
    v_full_name,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'display_name', ''), v_full_name, ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'first_name', ''), ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'last_name', ''), ''),
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'phone', NEW.raw_user_meta_data->>'phone_number', ''), ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'account_type', ''), 'traveler'),
    COALESCE((NEW.raw_user_meta_data->>'sms_notifications')::boolean, false),
    false,
    false,
    v_email
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Legitimate "profile already exists" case from ON CONFLICT (id) DO NOTHING
    -- or a race on the username uniqueness check. Safe to ignore — auth user
    -- stays valid and a profile row exists.
    RAISE WARNING 'handle_new_user unique_violation (non-fatal): %', SQLERRM;
    RETURN NEW;
  -- NOTE: WHEN OTHERS catch-all intentionally removed.
  -- Previously this swallowed every error and returned NEW, which let
  -- auth.users rows be created without a matching public.profiles row
  -- (orphaned accounts that couldn't re-register). Now any unexpected
  -- failure propagates so the auth signup fails cleanly and the user
  -- can retry, instead of silently producing a broken account.
END;
$$;