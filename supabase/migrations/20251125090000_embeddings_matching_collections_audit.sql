-- Embeddings + matching schema, collection items/moodboards, and booking audit logs/bulk updates

-- Enable pgvector if missing
CREATE EXTENSION IF NOT EXISTS vector;

-- Embeddings for creator/agent profiles
CREATE TABLE IF NOT EXISTS public.profile_embeddings (
  profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('creator','agent')) NOT NULL,
  embedding vector(1536),
  source JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Embeddings for travelers
CREATE TABLE IF NOT EXISTS public.traveler_embeddings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  embedding vector(1536),
  source JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Candidate matches per trip
CREATE TABLE IF NOT EXISTS public.trip_match_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_request_id UUID NOT NULL REFERENCES public.trip_requests(id) ON DELETE CASCADE,
  candidate_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('creator','agent')) NOT NULL,
  similarity_score NUMERIC NOT NULL,
  heuristic_score NUMERIC NOT NULL DEFAULT 0,
  final_score NUMERIC NOT NULL,
  explanation TEXT,
  explanation_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_match_candidates_trip
  ON public.trip_match_candidates (trip_request_id);

-- Multi-assignee tracking
CREATE TABLE IF NOT EXISTS public.trip_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_request_id UUID NOT NULL REFERENCES public.trip_requests(id) ON DELETE CASCADE,
  assignee_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('creator','agent')) NOT NULL,
  status TEXT CHECK (status IN ('pending','accepted','declined','removed')) NOT NULL DEFAULT 'pending',
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_assignments_trip
  ON public.trip_assignments (trip_request_id);

CREATE OR REPLACE FUNCTION public.handle_trip_assignments_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_trip_assignments_updated_at ON public.trip_assignments;

CREATE TRIGGER trg_trip_assignments_updated_at
BEFORE UPDATE ON public.trip_assignments
FOR EACH ROW EXECUTE FUNCTION public.handle_trip_assignments_updated_at();

-- Traveler manual overrides
CREATE TABLE IF NOT EXISTS public.trip_manual_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_request_id UUID NOT NULL REFERENCES public.trip_requests(id) ON DELETE CASCADE,
  preferred_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('creator','agent')) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_manual_preferences_trip
  ON public.trip_manual_preferences (trip_request_id);

-- Collection items
CREATE TABLE IF NOT EXISTS public.collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.brand_collections(id) ON DELETE CASCADE,
  item_type TEXT CHECK (item_type IN ('hotel','experience','route','other')) NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  image_url TEXT,
  external_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_collection_items_collection
  ON public.collection_items (collection_id);

-- Moodboard saves
CREATE TABLE IF NOT EXISTS public.moodboard_collection_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL REFERENCES public.brand_collections(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_moodboard_collection_unique
  ON public.moodboard_collection_saves (user_id, collection_id);

-- Aggregated stats
CREATE TABLE IF NOT EXISTS public.collection_stats (
  collection_id UUID PRIMARY KEY REFERENCES public.brand_collections(id) ON DELETE CASCADE,
  views_count BIGINT NOT NULL DEFAULT 0,
  saves_count BIGINT NOT NULL DEFAULT 0,
  trip_inquiries_count BIGINT NOT NULL DEFAULT 0,
  last_engagement_at TIMESTAMPTZ
);

-- Refresh helper to keep collection_stats in sync with engagements and saves
CREATE OR REPLACE FUNCTION public.refresh_collection_stats(p_collection_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_views BIGINT;
  v_saves BIGINT;
  v_inquiries BIGINT;
  v_last TIMESTAMPTZ;
BEGIN
  IF p_collection_id IS NULL THEN
    RETURN;
  END IF;

  SELECT COUNT(*)
  INTO v_views
  FROM public.brand_engagement_events e
  WHERE e.context_type = 'brand_collection'
    AND e.context_id = p_collection_id
    AND e.event_type IN ('discovered','profile_view');

  SELECT COUNT(*)
  INTO v_saves
  FROM public.moodboard_collection_saves s
  WHERE s.collection_id = p_collection_id;

  SELECT COUNT(*)
  INTO v_inquiries
  FROM public.trip_requests tr
  WHERE tr.source_collection_id = p_collection_id;

  SELECT MAX(ts) INTO v_last FROM (
    SELECT MAX(created_at) AS ts FROM public.brand_engagement_events e WHERE e.context_id = p_collection_id
    UNION ALL
    SELECT MAX(created_at) AS ts FROM public.moodboard_collection_saves s WHERE s.collection_id = p_collection_id
  ) AS combined;

  INSERT INTO public.collection_stats (
    collection_id,
    views_count,
    saves_count,
    trip_inquiries_count,
    last_engagement_at
  )
  VALUES (p_collection_id, COALESCE(v_views, 0), COALESCE(v_saves, 0), COALESCE(v_inquiries, 0), v_last)
  ON CONFLICT (collection_id)
  DO UPDATE SET
    views_count = EXCLUDED.views_count,
    saves_count = EXCLUDED.saves_count,
    trip_inquiries_count = EXCLUDED.trip_inquiries_count,
    last_engagement_at = EXCLUDED.last_engagement_at;
END;
$$;

-- Trigger for brand engagement events
CREATE OR REPLACE FUNCTION public.handle_brand_collection_engagement()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.context_type = 'brand_collection' AND NEW.context_id IS NOT NULL THEN
    PERFORM public.refresh_collection_stats(NEW.context_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_collection_engagement_stats ON public.brand_engagement_events;
CREATE TRIGGER trg_collection_engagement_stats
AFTER INSERT ON public.brand_engagement_events
FOR EACH ROW EXECUTE FUNCTION public.handle_brand_collection_engagement();

-- Trigger for moodboard saves
CREATE OR REPLACE FUNCTION public.handle_moodboard_collection_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_id := NEW.collection_id;
  ELSE
    v_id := OLD.collection_id;
  END IF;

  PERFORM public.refresh_collection_stats(v_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_moodboard_collection_stats_ins ON public.moodboard_collection_saves;
CREATE TRIGGER trg_moodboard_collection_stats_ins
AFTER INSERT ON public.moodboard_collection_saves
FOR EACH ROW EXECUTE FUNCTION public.handle_moodboard_collection_stats();

DROP TRIGGER IF EXISTS trg_moodboard_collection_stats_del ON public.moodboard_collection_saves;
CREATE TRIGGER trg_moodboard_collection_stats_del
AFTER DELETE ON public.moodboard_collection_saves
FOR EACH ROW EXECUTE FUNCTION public.handle_moodboard_collection_stats();

-- Booking audit log for status changes
CREATE TABLE IF NOT EXISTS public.booking_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.trip_bookings(id) ON DELETE CASCADE,
  previous_status public.trip_booking_status,
  new_status public.trip_booking_status,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_audit_log_booking
  ON public.booking_audit_log (booking_id);

DROP FUNCTION IF EXISTS public.admin_update_trip_booking_status(UUID, TEXT);

-- Update admin_update_trip_booking_status to write to audit log
CREATE OR REPLACE FUNCTION public.admin_update_trip_booking_status(
  p_booking_id UUID,
  p_new_status TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trip_id UUID;
  v_previous_status public.trip_booking_status;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'::app_role
  ) THEN
    RAISE EXCEPTION 'Not authorized: admin role required';
  END IF;

  SELECT status, trip_request_id INTO v_previous_status, v_trip_id
  FROM public.trip_bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF v_trip_id IS NULL THEN
    RAISE EXCEPTION 'Booking not found: %', p_booking_id;
  END IF;

  UPDATE public.trip_bookings
  SET status = p_new_status::text,
      updated_at = now()
  WHERE id = p_booking_id;

  INSERT INTO public.booking_audit_log (
    booking_id,
    previous_status,
    new_status,
    changed_by,
    reason
  ) VALUES (
    p_booking_id,
    v_previous_status,
    p_new_status::public.trip_booking_status,
    auth.uid(),
    p_reason
  );

  IF p_new_status = 'paid_out' THEN
    UPDATE public.trip_requests
    SET status = 'completed',
        updated_at = now()
    WHERE id = v_trip_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_trip_booking_status(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_trip_booking_status(UUID, TEXT, TEXT) TO authenticated;

-- Bulk booking status updates
CREATE OR REPLACE FUNCTION public.admin_bulk_update_trip_booking_status(
  p_booking_ids UUID[],
  p_new_status TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec RECORD;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'::app_role
  ) THEN
    RAISE EXCEPTION 'Not authorized: admin role required';
  END IF;

  FOR rec IN
    SELECT id, status FROM public.trip_bookings WHERE id = ANY(p_booking_ids)
  LOOP
    UPDATE public.trip_bookings
    SET status = p_new_status::text,
        updated_at = now()
    WHERE id = rec.id;

    INSERT INTO public.booking_audit_log (
      booking_id,
      previous_status,
      new_status,
      changed_by,
      reason
    ) VALUES (
      rec.id,
      rec.status,
      p_new_status::public.trip_booking_status,
      auth.uid(),
      p_reason
    );
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_bulk_update_trip_booking_status(UUID[], TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_bulk_update_trip_booking_status(UUID[], TEXT, TEXT) TO authenticated;
