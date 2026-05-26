-- Create packaged_trips table for consumer marketplace
CREATE TABLE IF NOT EXISTS public.packaged_trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Basic trip information
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  destination TEXT NOT NULL,
  
  -- Pricing
  price_per_person NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  original_price NUMERIC, -- for showing discounts
  
  -- Duration
  duration_days INTEGER NOT NULL,
  duration_nights INTEGER,
  
  -- Media
  cover_image_url TEXT,
  image_gallery JSONB DEFAULT '[]'::jsonb,
  video_url TEXT,
  
  -- Trip details
  max_participants INTEGER,
  min_participants INTEGER DEFAULT 1,
  trip_type TEXT, -- adventure, luxury, cultural, etc.
  difficulty_level TEXT, -- easy, moderate, challenging
  tags TEXT[] DEFAULT '{}',
  highlights JSONB DEFAULT '[]'::jsonb,
  included JSONB DEFAULT '[]'::jsonb,
  not_included JSONB DEFAULT '[]'::jsonb,
  
  -- Availability
  available_from DATE,
  available_until DATE,
  departure_dates JSONB DEFAULT '[]'::jsonb, -- array of specific departure dates
  
  -- Creator/Agent info
  creator_id UUID REFERENCES public.profiles(id),
  creator_type TEXT NOT NULL DEFAULT 'agent' CHECK (creator_type IN ('agent', 'creator', 'platform')),
  agent_id UUID REFERENCES public.travel_agents(id),
  
  -- Engagement metrics
  view_count INTEGER DEFAULT 0,
  wishlist_count INTEGER DEFAULT 0,
  booking_count INTEGER DEFAULT 0,
  rating NUMERIC DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  review_count INTEGER DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_featured BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  
  -- Requirements
  passport_required BOOLEAN DEFAULT true,
  visa_required BOOLEAN DEFAULT false,
  vaccination_required BOOLEAN DEFAULT false,
  fitness_level_required TEXT,
  
  -- Policies
  cancellation_policy TEXT,
  refund_policy TEXT,
  terms_conditions TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.packaged_trips ENABLE ROW LEVEL SECURITY;

-- Anyone can view published trips
CREATE POLICY "Anyone can view published trips"
ON public.packaged_trips
FOR SELECT
USING (status = 'published');

-- Creators can view their own trips
CREATE POLICY "Creators can view their own trips"
ON public.packaged_trips
FOR SELECT
USING (auth.uid() = creator_id);

-- Creators can create trips
CREATE POLICY "Creators can create their own trips"
ON public.packaged_trips
FOR INSERT
WITH CHECK (auth.uid() = creator_id);

-- Creators can update their own trips
CREATE POLICY "Creators can update their own trips"
ON public.packaged_trips
FOR UPDATE
USING (auth.uid() = creator_id);

-- Creators can delete their own trips
CREATE POLICY "Creators can delete their own trips"
ON public.packaged_trips
FOR DELETE
USING (auth.uid() = creator_id);

-- Agents can manage trips they're associated with
CREATE POLICY "Agents can manage their trips"
ON public.packaged_trips
FOR ALL
USING (
  agent_id IN (
    SELECT id FROM travel_agents WHERE user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_packaged_trips_status ON public.packaged_trips(status) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_packaged_trips_destination ON public.packaged_trips(destination);
CREATE INDEX IF NOT EXISTS idx_packaged_trips_creator ON public.packaged_trips(creator_id);
CREATE INDEX IF NOT EXISTS idx_packaged_trips_agent ON public.packaged_trips(agent_id);
CREATE INDEX IF NOT EXISTS idx_packaged_trips_tags ON public.packaged_trips USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_packaged_trips_featured ON public.packaged_trips(is_featured) WHERE is_featured = true;

-- Create trigger for updated_at
CREATE TRIGGER update_packaged_trips_updated_at
BEFORE UPDATE ON public.packaged_trips
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Generate slug automatically from title
CREATE OR REPLACE FUNCTION generate_trip_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(regexp_replace(NEW.title, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(NEW.id::text, 1, 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_trip_slug
BEFORE INSERT OR UPDATE ON public.packaged_trips
FOR EACH ROW
EXECUTE FUNCTION generate_trip_slug();
