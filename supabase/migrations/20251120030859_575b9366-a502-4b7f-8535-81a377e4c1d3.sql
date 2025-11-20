-- Add brand/collection source tracking to trip_requests
ALTER TABLE public.trip_requests
  ADD COLUMN IF NOT EXISTS source_brand_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_collection_id uuid REFERENCES public.brand_collections(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_type text CHECK (source_type IN ('brand_collection', 'marketplace', 'concierge', 'direct')),
  ADD COLUMN IF NOT EXISTS source_metadata jsonb DEFAULT '{}'::jsonb;

-- Add indexes for attribution queries
CREATE INDEX IF NOT EXISTS idx_trip_requests_source_brand 
  ON public.trip_requests(source_brand_profile_id) 
  WHERE source_brand_profile_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_trip_requests_source_collection 
  ON public.trip_requests(source_collection_id) 
  WHERE source_collection_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.trip_requests.source_metadata IS 
  'Stores flexible source context like collection_title, storyboard tags, etc.';