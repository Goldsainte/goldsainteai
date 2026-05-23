
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  -- Explicit pre-check: a profile with this email already belongs to another
  -- auth user. We cannot attach a new auth.users row to an existing profile
  -- (profiles.id IS the auth user id), so silently swallowing the resulting
  -- unique_violation would orphan the new auth user. Fail the signup cleanly
  -- with an identifiable error the client can surface as
  -- "An account with this email already exists — please sign in".
  IF v_email IS NOT NULL AND v_email <> '' THEN
    IF EXISTS (SELECT 1 FROM public.profiles WHERE email = v_email) THEN
      RAISE EXCEPTION 'email_already_registered'
        USING ERRCODE = 'unique_violation',
              HINT = 'An account with this email already exists. Please sign in instead.';
    END IF;
  END IF;

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

  -- NOTE: No EXCEPTION block. The previous WHEN unique_violation THEN RETURN NEW
  -- swallowed email collisions and let an auth.users row be created with no
  -- matching profiles row (orphan). With the explicit pre-check above, email
  -- collisions now fail loudly before the INSERT. Username collisions are
  -- pre-resolved by the WHILE loop. Any other unique_violation (e.g. a
  -- vanishingly rare username race) propagates so the auth signup fails
  -- cleanly and the user can retry, instead of producing a half-state.
  -- The WHEN OTHERS catch-all is also intentionally absent.
END;
$function$;
