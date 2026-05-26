-- Drop existing table if it exists (clean slate)
DROP TABLE IF EXISTS public.travel_packages CASCADE;

-- Create travel_packages table
CREATE TABLE IF NOT EXISTS public.travel_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  destination TEXT NOT NULL,
  departure_date DATE NOT NULL,
  return_date DATE NOT NULL,
  travelers_count INTEGER DEFAULT 1,
  flight_details JSONB,
  hotel_details JSONB,
  car_details JSONB,
  total_price NUMERIC(10,2) NOT NULL,
  bundled_price NUMERIC(10,2) NOT NULL,
  savings_amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.travel_packages ENABLE ROW LEVEL SECURITY;

-- Users can view their own packages
CREATE POLICY "Users can view own packages"
  ON public.travel_packages FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own packages
CREATE POLICY "Users can create own packages"
  ON public.travel_packages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own packages
CREATE POLICY "Users can update own packages"
  ON public.travel_packages FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own packages
CREATE POLICY "Users can delete own packages"
  ON public.travel_packages FOR DELETE
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_travel_packages_updated_at
  BEFORE UPDATE ON public.travel_packages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();