-- Add source_media column to trip_requests for storing inspiration items
ALTER TABLE public.trip_requests 
ADD COLUMN IF NOT EXISTS source_media jsonb DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.trip_requests.source_media IS 'JSON array of inspiration items: [{type: "image"|"tiktok"|"note", url?: string, content?: string, caption?: string}]';