-- Create price alerts table
CREATE TABLE IF NOT EXISTS public.flight_price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  origin_code TEXT NOT NULL,
  destination_code TEXT NOT NULL,
  departure_date DATE NOT NULL,
  return_date DATE,
  adults INTEGER NOT NULL DEFAULT 1,
  cabin_class TEXT NOT NULL DEFAULT 'ECONOMY',
  target_price NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  current_price NUMERIC,
  last_checked_at TIMESTAMP WITH TIME ZONE,
  last_notified_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notification_frequency TEXT NOT NULL DEFAULT 'instant', -- instant, daily, weekly
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- CREATE INDEX IF NOT EXISTS for efficient queries
CREATE INDEX IF NOT EXISTS idx_flight_price_alerts_user_id ON public.flight_price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_flight_price_alerts_active ON public.flight_price_alerts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_flight_price_alerts_last_checked ON public.flight_price_alerts(last_checked_at);

-- Enable RLS
ALTER TABLE public.flight_price_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own price alerts"
  ON public.flight_price_alerts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own price alerts"
  ON public.flight_price_alerts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own price alerts"
  ON public.flight_price_alerts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own price alerts"
  ON public.flight_price_alerts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_flight_price_alerts_updated_at
  BEFORE UPDATE ON public.flight_price_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create function to get user's active alerts count
CREATE OR REPLACE FUNCTION public.get_user_active_alerts_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.flight_price_alerts
  WHERE user_id = p_user_id AND is_active = true;
$$;
