-- Create story_highlights table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.story_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  cover_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.story_highlights ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own highlights"
  ON public.story_highlights
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own highlights"
  ON public.story_highlights
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own highlights"
  ON public.story_highlights
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own highlights"
  ON public.story_highlights
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.story_highlights
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();