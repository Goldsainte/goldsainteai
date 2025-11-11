-- Create webhook_events table for idempotency
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'stripe',
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processing_status TEXT NOT NULL DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON public.webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON public.webhook_events(created_at DESC);

-- Enable RLS
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Admin-only access policy
CREATE POLICY "Admin users can view webhook events"
  ON public.webhook_events
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create user_travel_preferences table for AI memory
CREATE TABLE IF NOT EXISTS public.user_travel_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  travel_style TEXT[],
  budget_preference TEXT,
  preferred_destinations TEXT[],
  preferred_accommodation_types TEXT[],
  preferred_airlines TEXT[],
  dietary_restrictions TEXT[],
  accessibility_needs TEXT[],
  travel_companions TEXT,
  trip_frequency TEXT,
  booking_preferences JSONB DEFAULT '{}'::jsonb,
  conversation_context JSONB DEFAULT '{}'::jsonb,
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_travel_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only access their own preferences
CREATE POLICY "Users can view own travel preferences"
  ON public.user_travel_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own travel preferences"
  ON public.user_travel_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own travel preferences"
  ON public.user_travel_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Trigger to update last_updated_at
CREATE OR REPLACE FUNCTION public.update_travel_preferences_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.last_updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_travel_preferences_updated_at
  BEFORE UPDATE ON public.user_travel_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_travel_preferences_timestamp();