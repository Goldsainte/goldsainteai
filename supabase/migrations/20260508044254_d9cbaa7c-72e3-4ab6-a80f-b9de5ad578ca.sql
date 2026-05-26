CREATE TABLE IF NOT EXISTS public.trip_wishlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES public.packaged_trips(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, trip_id)
);

CREATE INDEX IF NOT EXISTS idx_trip_wishlists_user ON public.trip_wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_wishlists_trip ON public.trip_wishlists(trip_id);

ALTER TABLE public.trip_wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own wishlists" ON public.trip_wishlists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own wishlists" ON public.trip_wishlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own wishlists" ON public.trip_wishlists
  FOR DELETE USING (auth.uid() = user_id);
