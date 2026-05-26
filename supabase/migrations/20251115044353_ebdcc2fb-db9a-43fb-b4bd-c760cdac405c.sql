-- Create storyboard_media_library table for Travel Storyboard feature
CREATE TABLE IF NOT EXISTS public.storyboard_media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  label TEXT,
  destination_tags TEXT[],
  mood_tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.storyboard_media_library ENABLE ROW LEVEL SECURITY;

-- Allow public read access (anyone can view storyboard images)
CREATE POLICY "Anyone can view storyboard images"
  ON public.storyboard_media_library
  FOR SELECT
  USING (true);

-- Only admins can insert/update/delete storyboard images
CREATE POLICY "Only admins can manage storyboard images"
  ON public.storyboard_media_library
  FOR ALL
  USING (public.is_admin());

-- Add updated_at trigger
CREATE TRIGGER set_storyboard_media_updated_at
  BEFORE UPDATE ON public.storyboard_media_library
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- CREATE INDEX IF NOT EXISTS for faster queries
CREATE INDEX IF NOT EXISTS idx_storyboard_media_created_at ON public.storyboard_media_library(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_storyboard_media_destination_tags ON public.storyboard_media_library USING GIN(destination_tags);
CREATE INDEX IF NOT EXISTS idx_storyboard_media_mood_tags ON public.storyboard_media_library USING GIN(mood_tags);
