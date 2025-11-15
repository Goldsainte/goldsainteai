-- Create trips table
CREATE TABLE IF NOT EXISTS public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  traveler_id uuid NOT NULL,
  title text,
  description text,
  destination text,
  start_date date,
  end_date date,
  travelers_count integer,
  budget_range text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'matched', 'in_progress', 'completed', 'canceled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_trips_traveler_id ON public.trips(traveler_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_created_at ON public.trips(created_at DESC);

-- Enable RLS
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- Travelers can manage their own trips
CREATE POLICY "Travelers can manage their own trips"
  ON public.trips
  FOR ALL
  USING (traveler_id = auth.uid())
  WITH CHECK (traveler_id = auth.uid());

-- Anyone can view open trips
CREATE POLICY "Anyone can view open trips"
  ON public.trips
  FOR SELECT
  USING (status = 'open');

-- Create chat_threads table
CREATE TABLE IF NOT EXISTS public.chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_threads_trip_id ON public.chat_threads(trip_id);

ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trip participants can view chat threads"
  ON public.chat_threads
  FOR SELECT
  USING (
    trip_id IN (
      SELECT id FROM public.trips WHERE traveler_id = auth.uid()
    )
  );

-- Extend profiles table with TikTok and AI matching fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type text
    CHECK (account_type IN ('traveler', 'creator', 'agent')),
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS tiktok_handle text,
  ADD COLUMN IF NOT EXISTS tiktok_followers integer,
  ADD COLUMN IF NOT EXISTS tiktok_niche_tags text[],
  ADD COLUMN IF NOT EXISTS destinations_focus_tags text[],
  ADD COLUMN IF NOT EXISTS content_style_tags text[];

-- Create trip_matches table to store AI match records
CREATE TABLE IF NOT EXISTS public.trip_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL,
  provider_type text NOT NULL CHECK (provider_type IN ('creator', 'agent')),
  score numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_trip_matches_trip_id ON public.trip_matches(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_matches_provider_id ON public.trip_matches(provider_id);

-- Enable RLS on trip_matches
ALTER TABLE public.trip_matches ENABLE ROW LEVEL SECURITY;

-- Trip owners can view matches for their trips
CREATE POLICY "Trip owners can view their trip matches"
  ON public.trip_matches
  FOR SELECT
  USING (
    trip_id IN (
      SELECT id FROM public.trips WHERE traveler_id = auth.uid()
    )
  );

-- Matched providers can view their own matches
CREATE POLICY "Providers can view their own matches"
  ON public.trip_matches
  FOR SELECT
  USING (provider_id = auth.uid());

-- Service role can manage all matches
CREATE POLICY "Service role can manage trip matches"
  ON public.trip_matches
  FOR ALL
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role')::text = 'service_role'
  );

-- Create trigger to update updated_at on trips
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_threads_updated_at
  BEFORE UPDATE ON public.chat_threads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();