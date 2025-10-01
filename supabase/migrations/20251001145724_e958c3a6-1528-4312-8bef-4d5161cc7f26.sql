-- Create user preferences table for auto-booking settings
CREATE TABLE IF NOT EXISTS public.user_booking_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  auto_booking_enabled boolean DEFAULT false,
  preferred_hotel_rating integer CHECK (preferred_hotel_rating BETWEEN 1 AND 5),
  max_price_per_night numeric,
  preferred_amenities text[],
  dietary_restrictions text[],
  accessibility_needs text[],
  preferred_airlines text[],
  seat_preference text,
  meal_preference text,
  special_requests text,
  notification_preferences jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_booking_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY "user_prefs_view_own" ON public.user_booking_preferences
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "user_prefs_insert_own" ON public.user_booking_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "user_prefs_update_own" ON public.user_booking_preferences
FOR UPDATE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_booking_preferences_updated_at
BEFORE UPDATE ON public.user_booking_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();