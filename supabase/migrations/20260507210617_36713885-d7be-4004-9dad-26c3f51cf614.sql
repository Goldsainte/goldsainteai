
-- Trip variants for "Make It Mine" personalization
CREATE TABLE IF NOT EXISTS public.trip_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  trip_id UUID NOT NULL REFERENCES public.packaged_trips(id) ON DELETE CASCADE,
  modifiers JSONB NOT NULL DEFAULT '[]'::jsonb,
  generated_itinerary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_variants_user ON public.trip_variants(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_variants_trip ON public.trip_variants(trip_id);

ALTER TABLE public.trip_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own trip variants"
  ON public.trip_variants FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own trip variants"
  ON public.trip_variants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own trip variants"
  ON public.trip_variants FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own trip variants"
  ON public.trip_variants FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_trip_variants_updated_at
  BEFORE UPDATE ON public.trip_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Marketplace signals RPC: returns aggregate trending/recent counts
CREATE OR REPLACE FUNCTION public.get_marketplace_signals()
RETURNS TABLE (
  trending_count INTEGER,
  recently_booked_count INTEGER,
  new_creators_count INTEGER,
  total_saves_this_month INTEGER,
  active_trips INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(*)::int FROM packaged_trips WHERE status='published' AND view_count > 50 AND updated_at > now() - interval '14 days'),
    (SELECT COUNT(*)::int FROM packaged_trips WHERE status='published' AND booking_count > 0 AND updated_at > now() - interval '30 days'),
    (SELECT COUNT(DISTINCT creator_id)::int FROM packaged_trips WHERE status='published' AND created_at > now() - interval '30 days'),
    (SELECT COALESCE(SUM(wishlist_count),0)::int FROM packaged_trips WHERE status='published'),
    (SELECT COUNT(*)::int FROM packaged_trips WHERE status='published');
$$;

GRANT EXECUTE ON FUNCTION public.get_marketplace_signals() TO anon, authenticated;
