-- Add columns to storyboard_items for save-to-storyboard feature
-- These columns enable tracking asset types and preserving original data

-- Add 'kind' column to distinguish asset types (photo, brand_collection, creator_profile, etc.)
ALTER TABLE public.storyboard_items 
ADD COLUMN IF NOT EXISTS kind TEXT;

-- Add 'source' column to track where the item came from
ALTER TABLE public.storyboard_items 
ADD COLUMN IF NOT EXISTS source TEXT;

-- Add 'metadata' column to store original asset data (tags, titles, URLs, etc.)
ALTER TABLE public.storyboard_items 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- CREATE INDEX IF NOT EXISTS on kind for filtering by asset type
CREATE INDEX IF NOT EXISTS idx_storyboard_items_kind ON public.storyboard_items(kind);

-- CREATE INDEX IF NOT EXISTS on source for tracking origins
CREATE INDEX IF NOT EXISTS idx_storyboard_items_source ON public.storyboard_items(source);

-- Create GIN index on metadata for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_storyboard_items_metadata ON public.storyboard_items USING GIN(metadata);
