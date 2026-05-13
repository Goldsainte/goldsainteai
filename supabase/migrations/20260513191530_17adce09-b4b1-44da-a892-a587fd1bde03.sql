CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  v_full_name text;
  v_first_name text;
  v_last_name text;
  v_username text;
  v_base_username text;
  v_suffix int := 0;
BEGIN
  v_full_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'name', ''),
    ''
  );
  v_first_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'first_name', ''),
    NULLIF(split_part(v_full_name, ' ', 1), ''),
    ''
  );
  v_last_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'last_name', ''),
    NULLIF(TRIM(SUBSTRING(v_full_name FROM POSITION(' ' IN v_full_name))), ''),
    ''
  );

  v_base_username := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'username', ''),
    NULLIF(lower(regexp_replace(split_part(NEW.email, '@', 1), '[^a-z0-9]', '', 'g')), ''),
    'user' || substring(NEW.id::text, 1, 8)
  );
  v_base_username := substring(v_base_username, 1, 25);
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
    v_first_name,
    v_last_name,
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'phone', NEW.raw_user_meta_data->>'phone_number', ''), ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'account_type', ''), 'traveler'),
    COALESCE((NEW.raw_user_meta_data->>'sms_notifications')::boolean, false),
    false,
    false,
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;