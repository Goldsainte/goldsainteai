-- Add date and ordering fields to trip_suggestions table
ALTER TABLE public.trip_suggestions
ADD COLUMN IF NOT EXISTS scheduled_date DATE,
ADD COLUMN IF NOT EXISTS day_number INTEGER,
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_trip_suggestions_scheduled_date 
ON public.trip_suggestions(trip_id, scheduled_date, display_order);