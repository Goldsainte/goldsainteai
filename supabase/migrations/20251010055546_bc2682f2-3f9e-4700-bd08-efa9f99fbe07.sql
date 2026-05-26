-- Create moments table (similar to Instagram stories)
CREATE TABLE IF NOT EXISTS public.moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  caption TEXT,
  duration_seconds INTEGER DEFAULT 5,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '24 hours')
);

-- Create moment views table
CREATE TABLE IF NOT EXISTS public.moment_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moment_id UUID NOT NULL REFERENCES public.moments(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(moment_id, viewer_id)
);

-- Create moment highlights table (rename story_highlights conceptually)
CREATE TABLE IF NOT EXISTS public.moment_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  cover_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create moment highlight items (moments saved to highlights)
CREATE TABLE IF NOT EXISTS public.moment_highlight_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  highlight_id UUID NOT NULL REFERENCES public.moment_highlights(id) ON DELETE CASCADE,
  moment_id UUID NOT NULL REFERENCES public.moments(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(highlight_id, moment_id)
);

-- Enable RLS
ALTER TABLE public.moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moment_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moment_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moment_highlight_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for moments
CREATE POLICY "Users can create their own moments"
  ON public.moments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view active moments from public profiles"
  ON public.moments FOR SELECT
  USING (expires_at > now());

CREATE POLICY "Users can delete their own moments"
  ON public.moments FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for moment views
CREATE POLICY "Users can record moment views"
  ON public.moment_views FOR INSERT
  WITH CHECK (auth.uid() = viewer_id);

CREATE POLICY "Moment owners can see who viewed"
  ON public.moment_views FOR SELECT
  USING (moment_id IN (
    SELECT id FROM public.moments WHERE user_id = auth.uid()
  ));

CREATE POLICY "Viewers can see their own views"
  ON public.moment_views FOR SELECT
  USING (auth.uid() = viewer_id);

-- RLS Policies for moment highlights
CREATE POLICY "Users can manage their own highlights"
  ON public.moment_highlights FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view highlights"
  ON public.moment_highlights FOR SELECT
  USING (true);

-- RLS Policies for moment highlight items
CREATE POLICY "Users can manage items in their highlights"
  ON public.moment_highlight_items FOR ALL
  USING (highlight_id IN (
    SELECT id FROM public.moment_highlights WHERE user_id = auth.uid()
  ))
  WITH CHECK (highlight_id IN (
    SELECT id FROM public.moment_highlights WHERE user_id = auth.uid()
  ));

CREATE POLICY "Anyone can view highlight items"
  ON public.moment_highlight_items FOR SELECT
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_moments_user_id ON public.moments(user_id);
CREATE INDEX IF NOT EXISTS idx_moments_expires_at ON public.moments(expires_at);
CREATE INDEX IF NOT EXISTS idx_moment_views_moment_id ON public.moment_views(moment_id);
CREATE INDEX IF NOT EXISTS idx_moment_highlights_user_id ON public.moment_highlights(user_id);

-- Function to auto-increment view count
CREATE OR REPLACE FUNCTION increment_moment_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.moments
  SET view_count = view_count + 1
  WHERE id = NEW.moment_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to increment view count
CREATE TRIGGER on_moment_view
  AFTER INSERT ON public.moment_views
  FOR EACH ROW
  EXECUTE FUNCTION increment_moment_view_count();
