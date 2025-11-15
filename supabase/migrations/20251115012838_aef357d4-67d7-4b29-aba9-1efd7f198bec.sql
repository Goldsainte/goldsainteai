-- One-time migration to populate creator_profiles from existing data
-- Only creates profiles for users who have published trip stories

INSERT INTO public.creator_profiles (
  user_id,
  display_name,
  handle,
  avatar_url,
  bio,
  tiktok_handle,
  tiktok_url,
  created_at,
  updated_at
)
SELECT DISTINCT
  p.id AS user_id,
  COALESCE(
    p.full_name,
    TRIM(CONCAT(p.first_name, ' ', p.last_name)),
    p.username,
    'Creator'
  ) AS display_name,
  LOWER(REGEXP_REPLACE(
    COALESCE(p.username, 'creator_' || SUBSTRING(p.id::TEXT, 1, 8)),
    '[^a-z0-9_]', '_', 'g'
  )) AS handle,
  p.avatar_url,
  p.bio,
  p.tiktok_username AS tiktok_handle,
  CASE 
    WHEN p.tiktok_username IS NOT NULL 
    THEN 'https://www.tiktok.com/@' || p.tiktok_username
    ELSE NULL
  END AS tiktok_url,
  NOW() AS created_at,
  NOW() AS updated_at
FROM public.profiles p
INNER JOIN public.trip_stories ts ON ts.user_id = p.id
WHERE ts.status = 'published'
  AND NOT EXISTS (
    SELECT 1 FROM public.creator_profiles cp
    WHERE cp.user_id = p.id
  )
ON CONFLICT (user_id) DO NOTHING;

-- Handle duplicate handles by appending a suffix
-- This ensures uniqueness if multiple users have similar usernames
WITH duplicate_handles AS (
  SELECT 
    user_id,
    handle,
    ROW_NUMBER() OVER (PARTITION BY handle ORDER BY created_at) as rn
  FROM public.creator_profiles
  WHERE handle IN (
    SELECT handle 
    FROM public.creator_profiles 
    GROUP BY handle 
    HAVING COUNT(*) > 1
  )
)
UPDATE public.creator_profiles cp
SET handle = cp.handle || '_' || dh.rn,
    updated_at = NOW()
FROM duplicate_handles dh
WHERE cp.user_id = dh.user_id 
  AND dh.rn > 1;