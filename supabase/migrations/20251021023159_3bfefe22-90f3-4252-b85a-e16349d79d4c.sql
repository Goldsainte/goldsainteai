-- Create travel_packages table for Shop marketplace
CREATE TABLE IF NOT EXISTS public.travel_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  package_summary TEXT,
  destination TEXT NOT NULL,
  country TEXT,
  city TEXT,
  region TEXT,
  duration_days INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  images TEXT[],
  video_url TEXT,
  creator_story TEXT,
  booking_cta TEXT,
  location_details JSONB DEFAULT '{}'::jsonb,
  dates_info JSONB DEFAULT '{}'::jsonb,
  whats_included JSONB DEFAULT '[]'::jsonb,
  pricing_details JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.travel_packages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active packages"
  ON public.travel_packages
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Creators can insert their own packages"
  ON public.travel_packages
  FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their own packages"
  ON public.travel_packages
  FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their own packages"
  ON public.travel_packages
  FOR DELETE
  USING (auth.uid() = creator_id);

-- CREATE INDEX IF NOT EXISTS for performance
CREATE INDEX IF NOT EXISTS idx_travel_packages_creator ON public.travel_packages(creator_id);
CREATE INDEX IF NOT EXISTS idx_travel_packages_active ON public.travel_packages(is_active) WHERE is_active = true;
