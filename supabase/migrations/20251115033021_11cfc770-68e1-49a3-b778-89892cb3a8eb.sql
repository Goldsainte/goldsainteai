-- Add destination column to cocurated_trip_requests
ALTER TABLE public.cocurated_trip_requests
ADD COLUMN IF NOT EXISTS destination text;

-- Add index for faster matching queries
CREATE INDEX IF NOT EXISTS idx_trip_requests_destination 
ON public.cocurated_trip_requests(destination);

-- Add comment
COMMENT ON COLUMN public.cocurated_trip_requests.destination IS 
'Primary destination for the trip request, used for AI matching';

-- Add matching-related columns to travel_agents
ALTER TABLE public.travel_agents
ADD COLUMN IF NOT EXISTS regions text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS max_group_size integer,
ADD COLUMN IF NOT EXISTS min_budget numeric,
ADD COLUMN IF NOT EXISTS max_budget numeric,
ADD COLUMN IF NOT EXISTS target_audience text[] DEFAULT '{}';

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_agents_regions 
ON public.travel_agents USING GIN(regions);

CREATE INDEX IF NOT EXISTS idx_agents_target_audience 
ON public.travel_agents USING GIN(target_audience);

-- Add comments
COMMENT ON COLUMN public.travel_agents.regions IS 
'Geographic regions the agent serves (supplements destinations array)';

COMMENT ON COLUMN public.travel_agents.max_group_size IS 
'Maximum group size the agent can handle';

COMMENT ON COLUMN public.travel_agents.min_budget IS 
'Minimum trip budget the agent works with (in USD)';

COMMENT ON COLUMN public.travel_agents.max_budget IS 
'Maximum trip budget the agent works with (in USD)';

COMMENT ON COLUMN public.travel_agents.target_audience IS 
'Target audience types (e.g., luxury, adventure, family, solo)';

-- Create storyboard media library table
CREATE TABLE IF NOT EXISTS public.storyboard_media_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  thumbnail_url text,
  label text,
  destination_tags text[] DEFAULT '{}',
  mood_tags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  is_featured boolean DEFAULT false,
  usage_count integer DEFAULT 0
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_media_destination_tags 
ON public.storyboard_media_library USING GIN(destination_tags);

CREATE INDEX IF NOT EXISTS idx_media_mood_tags 
ON public.storyboard_media_library USING GIN(mood_tags);

CREATE INDEX IF NOT EXISTS idx_media_created_at 
ON public.storyboard_media_library(created_at DESC);

-- Enable RLS
ALTER TABLE public.storyboard_media_library ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view media
CREATE POLICY "Anyone can view storyboard media"
ON public.storyboard_media_library
FOR SELECT
USING (true);

-- Policy: Authenticated users can insert
CREATE POLICY "Authenticated users can add media"
ON public.storyboard_media_library
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Policy: Users can update their own media
CREATE POLICY "Users can update their own media"
ON public.storyboard_media_library
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Add comments
COMMENT ON TABLE public.storyboard_media_library IS 
'Shared library of high-quality travel images for storyboards and marketing';

COMMENT ON COLUMN public.storyboard_media_library.destination_tags IS 
'Destination tags for filtering (e.g., Paris, Maldives, Tokyo)';

COMMENT ON COLUMN public.storyboard_media_library.mood_tags IS 
'Mood/style tags (e.g., luxury, adventure, romantic, family)';

COMMENT ON COLUMN public.storyboard_media_library.usage_count IS 
'Number of times this media has been used in storyboards';
