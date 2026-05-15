
CREATE OR REPLACE FUNCTION public.phone_exists(p_phone text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE phone = p_phone)
      OR EXISTS (SELECT 1 FROM auth.users WHERE phone = p_phone);
$$;

GRANT EXECUTE ON FUNCTION public.phone_exists(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  v_full_name text;
  v_username text;
  v_base_username text;
  v_suffix int := 0;
  v_email text;
  v_phone text;
BEGIN
  v_email := NEW.email;
  v_phone := NEW.phone;
  v_full_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'name', ''),
    ''
  );

  IF v_phone IS NOT NULL AND v_phone <> '' THEN
    IF EXISTS (SELECT 1 FROM public.profiles WHERE phone = v_phone AND id <> NEW.id) THEN
      v_phone := NULL;
      RAISE WARNING 'Phone % already exists on another profile, creating new user without phone link', NEW.phone;
    END IF;
  END IF;

  IF v_email IS NOT NULL AND v_email <> '' THEN
    v_base_username := lower(regexp_replace(split_part(v_email, '@', 1), '[^a-z0-9]', '', 'g'));
  ELSIF v_phone IS NOT NULL AND v_phone <> '' THEN
    v_base_username := 'user' || regexp_replace(v_phone, '[^0-9]', '', 'g');
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
    v_phone,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'account_type', ''), 'traveler'),
    CASE WHEN v_phone IS NOT NULL THEN true ELSE false END,
    false,
    false,
    v_email
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RAISE WARNING 'Profile creation failed due to unique violation: %', SQLERRM;
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE WARNING 'Profile creation failed: %', SQLERRM;
    RETURN NEW;
END;
$$;
