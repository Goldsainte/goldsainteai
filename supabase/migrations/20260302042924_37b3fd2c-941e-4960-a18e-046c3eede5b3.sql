
-- 1. Function to refresh creator stats from live data
CREATE OR REPLACE FUNCTION public.refresh_creator_stats(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_followers INTEGER;
  v_avg_views INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_followers
  FROM public.user_follows
  WHERE following_id = p_user_id;

  SELECT COALESCE(AVG(view_count)::INTEGER, 0) INTO v_avg_views
  FROM public.travel_posts
  WHERE user_id = p_user_id;

  UPDATE public.profiles
  SET creator_followers = v_followers,
      creator_avg_views = v_avg_views
  WHERE id = p_user_id;
END;
$$;

-- 2. Trigger function for user_follows changes
CREATE OR REPLACE FUNCTION public.trg_refresh_creator_followers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.refresh_creator_stats(NEW.following_id);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_creator_stats(OLD.following_id);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_creator_followers ON public.user_follows;
CREATE TRIGGER trg_refresh_creator_followers
AFTER INSERT OR DELETE ON public.user_follows
FOR EACH ROW EXECUTE FUNCTION public.trg_refresh_creator_followers();

-- 3. Trigger function for travel_posts view_count changes
CREATE OR REPLACE FUNCTION public.trg_refresh_creator_avg_views()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.refresh_creator_stats(NEW.user_id);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_creator_stats(OLD.user_id);
  ELSIF TG_OP = 'UPDATE' AND OLD.view_count IS DISTINCT FROM NEW.view_count THEN
    PERFORM public.refresh_creator_stats(NEW.user_id);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_creator_avg_views ON public.travel_posts;
CREATE TRIGGER trg_refresh_creator_avg_views
AFTER INSERT OR DELETE OR UPDATE OF view_count ON public.travel_posts
FOR EACH ROW EXECUTE FUNCTION public.trg_refresh_creator_avg_views();

-- 4. Add preferred_creator_id and preferred_agent_id to trip_requests
ALTER TABLE public.trip_requests
ADD COLUMN IF NOT EXISTS preferred_creator_id UUID,
ADD COLUMN IF NOT EXISTS preferred_agent_id UUID;
