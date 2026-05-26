-- ============================================
-- Brand Engagement Tracking & Collections
-- ============================================

-- 1) Enum for engagement event types
CREATE TYPE public.brand_engagement_type AS ENUM (
  'discovered',
  'profile_view',
  'moodboard_save',
  'trip_inquiry'
);

-- 2) Raw events table (append-only event log)
CREATE TABLE IF NOT EXISTS public.brand_engagement_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The brand (profile) that received the engagement
  brand_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- The user who did the action (can be null if anonymous)
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  event_type public.brand_engagement_type NOT NULL,

  -- Where this happened (for future segmentation)
  context_type TEXT CHECK (context_type IN ('marketplace', 'brand_profile', 'storyboard', 'trip', 'moodboard')),
  context_id UUID,

  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Useful indexes
CREATE INDEX IF NOT EXISTS idx_brand_engagement_brand_time
  ON public.brand_engagement_events (brand_profile_id, created_at);

CREATE INDEX IF NOT EXISTS idx_brand_engagement_event_type_time
  ON public.brand_engagement_events (event_type, created_at);

-- 3) Daily aggregate table for fast dashboard queries
CREATE TABLE IF NOT EXISTS public.brand_engagement_daily_stats (
  brand_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_date DATE NOT NULL,

  discovered_count INTEGER NOT NULL DEFAULT 0,
  profile_view_count INTEGER NOT NULL DEFAULT 0,
  moodboard_save_count INTEGER NOT NULL DEFAULT 0,
  trip_inquiry_count INTEGER NOT NULL DEFAULT 0,

  PRIMARY KEY (brand_profile_id, event_date)
);

-- 4) Trigger function to update rollups
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
    CASE WHEN NEW.event_type = 'discovered' THEN 1 ELSE 0 END,
    CASE WHEN NEW.event_type = 'profile_view' THEN 1 ELSE 0 END,
    CASE WHEN NEW.event_type = 'moodboard_save' THEN 1 ELSE 0 END,
    CASE WHEN NEW.event_type = 'trip_inquiry' THEN 1 ELSE 0 END
  )
  ON CONFLICT (brand_profile_id, event_date)
  DO UPDATE SET
    discovered_count = brand_engagement_daily_stats.discovered_count + EXCLUDED.discovered_count,
    profile_view_count = brand_engagement_daily_stats.profile_view_count + EXCLUDED.profile_view_count,
    moodboard_save_count = brand_engagement_daily_stats.moodboard_save_count + EXCLUDED.moodboard_save_count,
    trip_inquiry_count = brand_engagement_daily_stats.trip_inquiry_count + EXCLUDED.trip_inquiry_count;

  RETURN NEW;
END;
$$;

-- 5) Trigger for events table
CREATE TRIGGER trg_brand_engagement_rollup
AFTER INSERT ON public.brand_engagement_events
FOR EACH ROW EXECUTE FUNCTION public.handle_brand_engagement_rollup();

-- 6) RLS for events and stats tables
ALTER TABLE public.brand_engagement_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_engagement_daily_stats ENABLE ROW LEVEL SECURITY;

-- Brand owners can see their own raw events
CREATE POLICY "Brand owners can view their engagement events"
ON public.brand_engagement_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = brand_engagement_events.brand_profile_id
      AND p.id = auth.uid()
  )
);

-- Brand owners can see their own daily stats
CREATE POLICY "Brand owners can view their daily stats"
ON public.brand_engagement_daily_stats
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = brand_engagement_daily_stats.brand_profile_id
      AND p.id = auth.uid()
  )
);

-- 7) RPC: log_brand_engagement (security definer for safe client calls)
CREATE OR REPLACE FUNCTION public.log_brand_engagement(
  p_brand_profile_id UUID,
  p_event_type public.brand_engagement_type,
  p_context_type TEXT DEFAULT NULL,
  p_context_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
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

REVOKE ALL ON FUNCTION public.log_brand_engagement FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_brand_engagement TO anon, authenticated;

-- 8) Pinterest-style brand collections
CREATE TABLE IF NOT EXISTS public.brand_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  brand_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  tags TEXT[] DEFAULT '{}',

  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Keep updated_at fresh
CREATE OR REPLACE FUNCTION public.handle_brand_collections_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_brand_collections_updated_at
BEFORE UPDATE ON public.brand_collections
FOR EACH ROW EXECUTE FUNCTION public.handle_brand_collections_updated_at();

ALTER TABLE public.brand_collections ENABLE ROW LEVEL SECURITY;

-- Brand owners can manage their collections
CREATE POLICY "Brand can manage own collections"
ON public.brand_collections
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = brand_collections.brand_profile_id
      AND p.id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = brand_collections.brand_profile_id
      AND p.id = auth.uid()
  )
);