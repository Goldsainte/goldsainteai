-- Create trip_requests table
CREATE TABLE IF NOT EXISTS public.trip_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT,
  destination TEXT,
  start_date DATE,
  end_date DATE,
  flexible_dates BOOLEAN DEFAULT false,
  travelers_adults INTEGER,
  travelers_children INTEGER,
  budget_min INTEGER,
  budget_max INTEGER,
  trip_style TEXT[],
  description TEXT,
  tiktok_link TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trip_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can see their own trip requests"
ON public.trip_requests
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trip requests"
ON public.trip_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trip requests"
ON public.trip_requests
FOR UPDATE
USING (auth.uid() = user_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for updated_at
CREATE TRIGGER update_trip_requests_updated_at
BEFORE UPDATE ON public.trip_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();