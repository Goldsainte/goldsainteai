
ALTER TABLE public.creator_services
  ADD COLUMN IF NOT EXISTS service_tier TEXT DEFAULT 'custom_itinerary' CHECK (service_tier IN ('digital_guide', 'custom_itinerary', 'full_trip_design', 'add_on')),
  ADD COLUMN IF NOT EXISTS trip_days INTEGER,
  ADD COLUMN IF NOT EXISTS has_priority_support BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS file_url TEXT,
  ADD COLUMN IF NOT EXISTS delivery_time_option TEXT;
