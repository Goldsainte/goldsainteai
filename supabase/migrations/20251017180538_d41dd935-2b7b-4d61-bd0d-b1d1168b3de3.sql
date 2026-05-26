-- Create cocurated trip requests table
CREATE TABLE IF NOT EXISTS public.cocurated_trip_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'quoted', 'booked', 'cancelled')),
  
  -- Trip items (Amadeus tours or other experiences)
  trip_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Guest preferences
  total_travelers INTEGER DEFAULT 1,
  budget_range_min NUMERIC,
  budget_range_max NUMERIC,
  preferred_dates JSONB,
  special_requests TEXT,
  
  -- Assignment
  assigned_agent_id UUID REFERENCES public.travel_agents(id) ON DELETE SET NULL,
  quoted_price NUMERIC,
  quoted_details TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.cocurated_trip_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can create their own trip requests"
  ON public.cocurated_trip_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own trip requests"
  ON public.cocurated_trip_requests
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own trip requests"
  ON public.cocurated_trip_requests
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Agents can view assigned trip requests"
  ON public.cocurated_trip_requests
  FOR SELECT
  USING (assigned_agent_id IN (
    SELECT id FROM public.travel_agents WHERE user_id = auth.uid()
  ));

CREATE POLICY "Agents can view all pending trip requests"
  ON public.cocurated_trip_requests
  FOR SELECT
  USING (status = 'pending');

CREATE POLICY "Agents can update assigned trip requests"
  ON public.cocurated_trip_requests
  FOR UPDATE
  USING (assigned_agent_id IN (
    SELECT id FROM public.travel_agents WHERE user_id = auth.uid()
  ));

-- Trigger for updated_at
CREATE TRIGGER update_cocurated_trip_requests_updated_at
  BEFORE UPDATE ON public.cocurated_trip_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();