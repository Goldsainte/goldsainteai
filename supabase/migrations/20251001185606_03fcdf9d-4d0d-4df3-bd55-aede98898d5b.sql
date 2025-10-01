-- Add column to track if user wants preferences applied to searches
ALTER TABLE public.user_booking_preferences 
ADD COLUMN use_preferences_in_search boolean DEFAULT true;

COMMENT ON COLUMN public.user_booking_preferences.use_preferences_in_search IS 'Controls whether user preferences are applied as strict filters in AI agent searches';