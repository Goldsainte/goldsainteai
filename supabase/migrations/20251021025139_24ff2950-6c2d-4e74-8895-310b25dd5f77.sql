-- Create uber_ride_requests table
CREATE TABLE IF NOT EXISTS public.uber_ride_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  pickup_latitude DECIMAL(10, 8) NOT NULL,
  pickup_longitude DECIMAL(11, 8) NOT NULL,
  dropoff_latitude DECIMAL(10, 8) NOT NULL,
  dropoff_longitude DECIMAL(11, 8) NOT NULL,
  pickup_address TEXT,
  dropoff_address TEXT,
  product_id TEXT NOT NULL,
  fare_id TEXT,
  ride_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  estimated_price DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.uber_ride_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own ride requests"
  ON public.uber_ride_requests
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ride requests"
  ON public.uber_ride_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ride requests"
  ON public.uber_ride_requests
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_uber_ride_requests_updated_at
  BEFORE UPDATE ON public.uber_ride_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();