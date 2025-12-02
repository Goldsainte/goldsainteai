-- Create trip_itinerary_days table for day-by-day itinerary
CREATE TABLE IF NOT EXISTS public.trip_itinerary_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.packaged_trips(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  activities JSONB DEFAULT '[]',
  meals_included TEXT[] DEFAULT '{}',
  accommodation TEXT,
  accommodation_type TEXT,
  is_featured_day BOOLEAN DEFAULT false,
  overnight_location TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(trip_id, day_number)
);

-- Create trip_addons table for optional add-ons
CREATE TABLE IF NOT EXISTS public.trip_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.packaged_trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  addon_type TEXT NOT NULL,
  is_optional BOOLEAN DEFAULT true,
  max_quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create trip_activities table
CREATE TABLE IF NOT EXISTS public.trip_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.packaged_trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_included BOOLEAN DEFAULT true,
  additional_fee NUMERIC,
  currency TEXT DEFAULT 'USD',
  activity_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add new columns to packaged_trips if they don't exist
ALTER TABLE public.packaged_trips ADD COLUMN IF NOT EXISTS activity_level TEXT;
ALTER TABLE public.packaged_trips ADD COLUMN IF NOT EXISTS group_size_note TEXT;
ALTER TABLE public.packaged_trips ADD COLUMN IF NOT EXISTS recommended_arrival_airport TEXT;
ALTER TABLE public.packaged_trips ADD COLUMN IF NOT EXISTS recommended_departure_airport TEXT;
ALTER TABLE public.packaged_trips ADD COLUMN IF NOT EXISTS essential_info JSONB;
ALTER TABLE public.packaged_trips ADD COLUMN IF NOT EXISTS cancellation_policy JSONB;

-- Enable RLS
ALTER TABLE public.trip_itinerary_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_activities ENABLE ROW LEVEL SECURITY;

-- RLS policies for trip_itinerary_days
CREATE POLICY "Anyone can view trip itinerary days" ON public.trip_itinerary_days
  FOR SELECT USING (true);

CREATE POLICY "Trip owners can manage itinerary days" ON public.trip_itinerary_days
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.packaged_trips pt
      WHERE pt.id = trip_id AND pt.creator_id = auth.uid()
    )
  );

-- RLS policies for trip_addons
CREATE POLICY "Anyone can view trip addons" ON public.trip_addons
  FOR SELECT USING (true);

CREATE POLICY "Trip owners can manage addons" ON public.trip_addons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.packaged_trips pt
      WHERE pt.id = trip_id AND pt.creator_id = auth.uid()
    )
  );

-- RLS policies for trip_activities
CREATE POLICY "Anyone can view trip activities" ON public.trip_activities
  FOR SELECT USING (true);

CREATE POLICY "Trip owners can manage activities" ON public.trip_activities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.packaged_trips pt
      WHERE pt.id = trip_id AND pt.creator_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trip_itinerary_days_trip_id ON public.trip_itinerary_days(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_addons_trip_id ON public.trip_addons(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_activities_trip_id ON public.trip_activities(trip_id);