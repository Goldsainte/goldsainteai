
-- Drop and recreate functions with parameter name conflicts
DROP FUNCTION IF EXISTS public.get_creator_tiktok_lab_metrics(uuid);
DROP FUNCTION IF EXISTS public.get_user_ai_usage_count(uuid);

-- Recreate with search_path set
CREATE OR REPLACE FUNCTION public.get_creator_tiktok_lab_metrics(creator_id_input uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_posts', COUNT(*),
    'total_views', COALESCE(SUM(view_count), 0),
    'total_likes', COALESCE(SUM(like_count), 0),
    'total_shares', COALESCE(SUM(share_count), 0)
  ) INTO v_result
  FROM public.travel_posts
  WHERE user_id = creator_id_input;
  
  RETURN COALESCE(v_result, '{"total_posts": 0, "total_views": 0, "total_likes": 0, "total_shares": 0}'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_ai_usage_count(target_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.ai_usage_logs
  WHERE user_id = target_user_id
    AND created_at >= date_trunc('month', now());
  
  RETURN COALESCE(v_count, 0);
END;
$$;

-- Fix remaining trigger functions
CREATE OR REPLACE FUNCTION public.update_booking_messages_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_earnings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_trip_match_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_trip_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(regexp_replace(NEW.title, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(NEW.id::text, 1, 8);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_booking_number()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_number text;
BEGIN
  v_number := 'BK-' || to_char(now(), 'YYYYMMDD') || '-' || 
              upper(substring(md5(random()::text), 1, 6));
  RETURN v_number;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_booking_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.booking_number IS NULL THEN
    NEW.booking_number := public.generate_booking_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_brand_collections_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_brand_engagement_rollup()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.brand_engagement_daily_stats (
    brand_id,
    event_date,
    discovered_count,
    profile_view_count,
    moodboard_save_count,
    trip_inquiry_count
  )
  SELECT 
    NEW.brand_id,
    date_trunc('day', NEW.created_at)::date,
    CASE WHEN NEW.event_type = 'discovered' THEN 1 ELSE 0 END,
    CASE WHEN NEW.event_type = 'profile_view' THEN 1 ELSE 0 END,
    CASE WHEN NEW.event_type = 'moodboard_save' THEN 1 ELSE 0 END,
    CASE WHEN NEW.event_type = 'trip_inquiry' THEN 1 ELSE 0 END
  ON CONFLICT (brand_id, event_date)
  DO UPDATE SET
    discovered_count = brand_engagement_daily_stats.discovered_count + EXCLUDED.discovered_count,
    profile_view_count = brand_engagement_daily_stats.profile_view_count + EXCLUDED.profile_view_count,
    moodboard_save_count = brand_engagement_daily_stats.moodboard_save_count + EXCLUDED.moodboard_save_count,
    trip_inquiry_count = brand_engagement_daily_stats.trip_inquiry_count + EXCLUDED.trip_inquiry_count,
    updated_at = now();
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_commission_split(
  total_amount numeric,
  platform_pct numeric DEFAULT 15,
  agent_pct numeric DEFAULT 50,
  creator_pct numeric DEFAULT 35
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  platform_fee numeric;
  agent_share numeric;
  creator_share numeric;
BEGIN
  platform_fee := total_amount * (platform_pct / 100);
  agent_share := total_amount * (agent_pct / 100);
  creator_share := total_amount * (creator_pct / 100);
  
  RETURN jsonb_build_object(
    'platform_fee', platform_fee,
    'agent_share', agent_share,
    'creator_share', creator_share,
    'total', total_amount
  );
END;
$$;
