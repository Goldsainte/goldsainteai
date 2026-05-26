-- Create curated hotels table for fallback recommendations
CREATE TABLE IF NOT EXISTS public.curated_hotels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  city_code TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT 'US',
  rating NUMERIC NOT NULL DEFAULT 4.0,
  price_per_night NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  image_url TEXT NOT NULL,
  amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_curated_hotels_city_code ON public.curated_hotels(city_code);
CREATE INDEX IF NOT EXISTS idx_curated_hotels_active ON public.curated_hotels(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.curated_hotels ENABLE ROW LEVEL SECURITY;

-- Public can view active curated hotels
CREATE POLICY "Anyone can view active curated hotels"
  ON public.curated_hotels
  FOR SELECT
  USING (is_active = true);

-- Service role can manage all curated hotels (for admin operations)
CREATE POLICY "Service role can manage curated hotels"
  ON public.curated_hotels
  FOR ALL
  USING (
    ((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'service_role'::text
  );

-- Add updated_at trigger
CREATE TRIGGER update_curated_hotels_updated_at
  BEFORE UPDATE ON public.curated_hotels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial data
INSERT INTO public.curated_hotels (city_code, name, address, city, rating, price_per_night, image_url, amenities, description) VALUES
-- Miami
('MIA', 'The Fontainebleau Miami Beach', '4441 Collins Avenue', 'Miami Beach', 4.5, 350, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80', '["Pool", "Spa", "Beach Access", "Fitness Center", "Restaurant"]'::jsonb, 'Iconic beachfront resort with world-class amenities'),
('MIA', 'Mandarin Oriental Miami', '500 Brickell Key Drive', 'Miami', 4.7, 425, 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80', '["Spa", "Pool", "Restaurant", "Fitness Center", "Room Service"]'::jsonb, 'Luxury waterfront hotel in Brickell'),
('MIA', 'The Betsy Hotel', '1440 Ocean Drive', 'Miami Beach', 4.6, 380, 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80', '["Beach Access", "Pool", "Restaurant", "Bar", "WiFi"]'::jsonb, 'Boutique hotel on South Beach'),

-- New York City
('NYC', 'The Plaza Hotel', '768 5th Avenue', 'New York', 4.6, 550, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80', '["Spa", "Restaurant", "Concierge", "Fitness Center"]'::jsonb, 'Historic luxury hotel overlooking Central Park'),
('NYC', 'The Standard High Line', '848 Washington Street', 'New York', 4.4, 380, 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80', '["Pool", "Restaurant", "Bar", "Views", "WiFi"]'::jsonb, 'Modern hotel in the Meatpacking District'),

-- Los Angeles
('LAX', 'The Beverly Hills Hotel', '9641 Sunset Boulevard', 'Los Angeles', 4.7, 650, 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80', '["Pool", "Spa", "Restaurant", "Valet", "Tennis Courts"]'::jsonb, 'Legendary pink palace in Beverly Hills'),

-- Paris
('PAR', 'Le Royal Monceau', '37 Avenue Hoche', 'Paris', 4.8, 580, 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80', '["Spa", "Pool", "Restaurant", "Art Gallery", "Cinema"]'::jsonb, 'Art-focused luxury hotel near the Arc de Triomphe'),

-- London
('LON', 'The Savoy', 'Strand', 'London', 4.7, 520, 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80', '["Spa", "Pool", "Restaurant", "Thames Views", "Butler Service"]'::jsonb, 'Iconic hotel on the Thames'),

-- Tokyo
('TYO', 'Aman Tokyo', '1-5-6 Otemachi', 'Tokyo', 4.9, 780, 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80', '["Spa", "Pool", "Restaurant", "City Views", "Zen Garden"]'::jsonb, 'Serene urban sanctuary with stunning views');
