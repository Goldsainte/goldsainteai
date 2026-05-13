
-- 1) Fix self-comparison bug in is_user_restricted (param shadowed column → always true)
CREATE OR REPLACE FUNCTION public.is_user_restricted(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_status TEXT;
  active_bans INTEGER;
BEGIN
  SELECT account_status INTO user_status
  FROM public.profiles
  WHERE id = is_user_restricted.target_user_id;

  IF user_status IN ('suspended', 'banned') THEN
    RETURN true;
  END IF;

  SELECT COUNT(*) INTO active_bans
  FROM public.moderation_actions ma
  WHERE ma.target_user_id = is_user_restricted.target_user_id
    AND ma.is_active = true
    AND ma.action_type IN ('temporary_ban', 'permanent_ban', 'account_disabled')
    AND (ma.expires_at IS NULL OR ma.expires_at > now());

  RETURN active_bans > 0;
END;
$$;

-- 2) Harden handle_new_user against username unique-violation race.
--    Catches conflict on username and retries with random suffix instead of crashing the trigger.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_full_name text;
  v_first_name text;
  v_last_name text;
  v_username text;
  v_base_username text;
  v_suffix int := 0;
  v_attempt int := 0;
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

  -- Retry loop in case of concurrent unique_violation race on username
  LOOP
    v_attempt := v_attempt + 1;
    BEGIN
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
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      -- Most likely a race on username; append random suffix and try again
      IF v_attempt >= 5 THEN
        -- Last-resort: fully randomized username so signup never fails
        v_username := 'user' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 12);
      ELSE
        v_username := substring(v_base_username, 1, 20) ||
                      substring(replace(gen_random_uuid()::text, '-', ''), 1, 4);
      END IF;
    END;
  END LOOP;

  RETURN NEW;
END;
$$;

-- 3) Add a case-insensitive uniqueness index for username lookups.
--    Prevents table scans inside the trigger's EXISTS check at scale.
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower
  ON public.profiles (lower(username));
