
-- 1. Format constraint (UNIQUE + index already exist on profiles.username)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass AND conname = 'username_format'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT username_format
      CHECK (username IS NULL OR username ~ '^[a-z0-9-]{3,30}$')
      NOT VALID;
  END IF;
END $$;

-- 2. Backfill usernames with collision handling
DO $$
DECLARE
  r RECORD;
  base_handle TEXT;
  candidate TEXT;
  suffix INT;
BEGIN
  FOR r IN
    SELECT id, COALESCE(full_name, display_name, '') AS name_src
    FROM public.profiles
    WHERE username IS NULL
      AND COALESCE(full_name, display_name, '') <> ''
  LOOP
    base_handle := lower(regexp_replace(r.name_src, '[^a-zA-Z0-9]', '', 'g'));
    -- Trim/pad to satisfy 3-30 char constraint
    IF length(base_handle) < 3 THEN
      base_handle := base_handle || substr(replace(r.id::text, '-', ''), 1, 6);
    END IF;
    base_handle := substr(base_handle, 1, 28);
    IF length(base_handle) < 3 THEN
      CONTINUE;
    END IF;

    candidate := base_handle;
    suffix := 1;
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = candidate) LOOP
      suffix := suffix + 1;
      candidate := substr(base_handle, 1, 28) || '-' || suffix::text;
    END LOOP;

    UPDATE public.profiles SET username = candidate WHERE id = r.id;
  END LOOP;
END $$;

-- Validate constraint now that data conforms
ALTER TABLE public.profiles VALIDATE CONSTRAINT username_format;

-- 3. Featured TikTok videos
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS featured_tiktok_videos jsonb NOT NULL DEFAULT '[]'::jsonb;
