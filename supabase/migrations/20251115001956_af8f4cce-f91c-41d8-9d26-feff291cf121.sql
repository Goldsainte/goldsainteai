-- Add journey_id column to trip_stories to link stories to bookable trips
ALTER TABLE public.trip_stories
ADD COLUMN IF NOT EXISTS journey_id uuid;

-- Add foreign key constraint to packaged_trips
ALTER TABLE public.trip_stories
ADD CONSTRAINT trip_stories_journey_id_fkey
FOREIGN KEY (journey_id) 
REFERENCES public.packaged_trips(id) 
ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_trip_stories_journey_id 
ON public.trip_stories(journey_id);

-- Add comment for documentation
COMMENT ON COLUMN public.trip_stories.journey_id IS 'Links this TikTok story to a bookable trip/package in packaged_trips table';