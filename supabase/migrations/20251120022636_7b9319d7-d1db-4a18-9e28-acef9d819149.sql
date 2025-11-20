-- =========================================================
-- Brand Engagement + Collections Migration (FINAL FIX)
-- Goldsainte AI
-- =========================================================

----------------------------------------------------------------
-- 1) Enum: brand_engagement_type
----------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'brand_engagement_type'
  ) THEN
    CREATE TYPE public.brand_engagement_type AS ENUM (
      'discovered',
      'profile_view',
      'moodboard_save',
      'trip_inquiry'
    );
  END IF;
END$$;


----------------------------------------------------------------
-- 2) View: brand_profiles_discovery
--    (brands & brand-like entities for marketplace/AI)
--    FINAL FIX: profiles.id IS the user_id (no separate user_id column)
----------------------------------------------------------------

CREATE OR REPLACE VIEW public.brand_profiles_discovery AS
SELECT
  p.id AS profile_id,
  p.id AS user_id,  -- profiles.id IS the auth user id
  COALESCE(p.full_name, p.username) AS name,
  p.avatar_url,
  p.bio,
  p.creator_niches AS categories,
  p.destinations_focus_tags AS regions,
  p.content_style_tags AS tags,
  p.country,
  p.account_type,
  s.supplier_type,
  s.name AS supplier_name,
  s.is_verified AS supplier_verified,
  s.rating AS supplier_rating,
  s.total_reviews AS supplier_reviews,
  NOW() AS created_at
FROM public.profiles p
LEFT JOIN public.suppliers s
  ON s.user_id = p.id
LEFT JOIN public.user_roles ur
  ON ur.user_id = p.id
WHERE
  ur.role = 'brand'
  OR s.id IS NOT NULL;


----------------------------------------------------------------
-- 3) Raw events table: brand_engagement_events
----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.brand_engagement_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type       public.brand_engagement_type NOT NULL,
  context_type     TEXT CHECK (
                      context_type IN (
                        'marketplace',
                        'brand_profile',
                        'storyboard',
                        'trip',
                        'moodboard'
                      )
                    ),
  context_id       UUID,
  metadata         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brand_engagement_brand_time
  ON public.brand_engagement_events (brand_profile_id, created_at);

CREATE INDEX IF NOT EXISTS idx_brand_engagement_event_type_time
  ON public.brand_engagement_events (event_type, created_at);


----------------------------------------------------------------
-- 4) Daily rollup table: brand_engagement_daily_stats
----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.brand_engagement_daily_stats (
  brand_profile_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_date           DATE NOT NULL,
  discovered_count     INTEGER NOT NULL DEFAULT 0,
  profile_view_count   INTEGER NOT NULL DEFAULT 0,
  moodboard_save_count INTEGER NOT NULL DEFAULT 0,
  trip_inquiry_count   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (brand_profile_id, event_date)
);


----------------------------------------------------------------
-- 5) Trigger function & trigger: maintain daily stats
----------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_brand_engagement_rollup()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_date DATE;
BEGIN
  v_date := (NEW.created_at AT TIME ZONE 'utc')::date;

  INSERT INTO public.brand_engagement_daily_stats (
    brand_profile_id,
    event_date,
    discovered_count,
    profile_view_count,
    moodboard_save_count,
    trip_inquiry_count
  )
  VALUES (
    NEW.brand_profile_id,
    v_date,
    CASE WHEN NEW.event_type = 'discovered'      THEN 1 ELSE 0 END,
    CASE WHEN NEW.event_type = 'profile_view'    THEN 1 ELSE 0 END,
    CASE WHEN NEW.event_type = 'moodboard_save'  THEN 1 ELSE 0 END,
    CASE WHEN NEW.event_type = 'trip_inquiry'    THEN 1 ELSE 0 END
  )
  ON CONFLICT (brand_profile_id, event_date)
  DO UPDATE SET
    discovered_count     = brand_engagement_daily_stats.discovered_count + EXCLUDED.discovered_count,
    profile_view_count   = brand_engagement_daily_stats.profile_view_count + EXCLUDED.profile_view_count,
    moodboard_save_count = brand_engagement_daily_stats.moodboard_save_count + EXCLUDED.moodboard_save_count,
    trip_inquiry_count   = brand_engagement_daily_stats.trip_inquiry_count + EXCLUDED.trip_inquiry_count;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_brand_engagement_rollup ON public.brand_engagement_events;

CREATE TRIGGER trg_brand_engagement_rollup
AFTER INSERT ON public.brand_engagement_events
FOR EACH ROW EXECUTE FUNCTION public.handle_brand_engagement_rollup();


----------------------------------------------------------------
-- 6) RLS for events & stats
----------------------------------------------------------------

ALTER TABLE public.brand_engagement_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_engagement_daily_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Brand owners can view their engagement events" ON public.brand_engagement_events;
CREATE POLICY "Brand owners can view their engagement events"
ON public.brand_engagement_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = brand_engagement_events.brand_profile_id
      AND p.id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Brand owners can view their daily stats" ON public.brand_engagement_daily_stats;
CREATE POLICY "Brand owners can view their daily stats"
ON public.brand_engagement_daily_stats
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = brand_engagement_daily_stats.brand_profile_id
      AND p.id = auth.uid()
  )
);


----------------------------------------------------------------
-- 7) RPC: log_brand_engagement
----------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.log_brand_engagement(
  p_brand_profile_id UUID,
  p_event_type       public.brand_engagement_type,
  p_context_type     TEXT   DEFAULT NULL,
  p_context_id       UUID   DEFAULT NULL,
  p_metadata         JSONB  DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.brand_engagement_events (
    brand_profile_id,
    actor_user_id,
    event_type,
    context_type,
    context_id,
    metadata
  )
  VALUES (
    p_brand_profile_id,
    auth.uid(),
    p_event_type,
    p_context_type,
    p_context_id,
    COALESCE(p_metadata, '{}'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.log_brand_engagement(UUID, public.brand_engagement_type, TEXT, UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_brand_engagement(UUID, public.brand_engagement_type, TEXT, UUID, JSONB) TO anon, authenticated;


----------------------------------------------------------------
-- 8) Brand collections: Pinterest-style boards for brands
----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.brand_collections (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  cover_image_url  TEXT,
  tags             TEXT[] DEFAULT '{}',
  is_published     BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order       INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.handle_brand_collections_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_brand_collections_updated_at ON public.brand_collections;

CREATE TRIGGER trg_brand_collections_updated_at
BEFORE UPDATE ON public.brand_collections
FOR EACH ROW EXECUTE FUNCTION public.handle_brand_collections_updated_at();

ALTER TABLE public.brand_collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Brand can manage own collections" ON public.brand_collections;
CREATE POLICY "Brand can manage own collections"
ON public.brand_collections
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = brand_collections.brand_profile_id
      AND p.id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = brand_collections.brand_profile_id
      AND p.id = auth.uid()
  )
);