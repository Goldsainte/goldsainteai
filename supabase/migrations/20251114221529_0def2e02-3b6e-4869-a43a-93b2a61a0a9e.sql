-- Create trip_stories table
CREATE TABLE IF NOT EXISTS public.trip_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  hook TEXT,
  caption TEXT NOT NULL,
  hero_image_url TEXT,
  itinerary_lines TEXT[],
  platforms TEXT[] DEFAULT ARRAY['TikTok']::TEXT[],
  tiktok_post_id TEXT,
  tiktok_published_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'queued', 'published', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add TikTok token fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS tiktok_access_token TEXT,
ADD COLUMN IF NOT EXISTS tiktok_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS tiktok_token_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS tiktok_connected_at TIMESTAMPTZ;

-- Enable RLS on trip_stories
ALTER TABLE public.trip_stories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trip_stories
CREATE POLICY "Users can view their own trip stories"
  ON public.trip_stories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own trip stories"
  ON public.trip_stories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trip stories"
  ON public.trip_stories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trip stories"
  ON public.trip_stories FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_trip_stories_updated_at
  BEFORE UPDATE ON public.trip_stories
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();