-- Create collections table
CREATE TABLE IF NOT EXISTS public.post_collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_private BOOLEAN DEFAULT true,
  cover_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- CREATE TABLE IF NOT EXISTS to store which posts are in which collections
CREATE TABLE IF NOT EXISTS public.collection_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES public.post_collections(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.travel_posts(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(collection_id, post_id)
);

-- Enable RLS
ALTER TABLE public.post_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for collections
CREATE POLICY "Users can view their own collections"
  ON public.post_collections
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own collections"
  ON public.post_collections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections"
  ON public.post_collections
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections"
  ON public.post_collections
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public collections"
  ON public.post_collections
  FOR SELECT
  USING (is_private = false);

-- RLS Policies for collection_posts
CREATE POLICY "Users can view posts in their collections"
  ON public.collection_posts
  FOR SELECT
  USING (collection_id IN (
    SELECT id FROM public.post_collections WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can add posts to their collections"
  ON public.collection_posts
  FOR INSERT
  WITH CHECK (collection_id IN (
    SELECT id FROM public.post_collections WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can remove posts from their collections"
  ON public.collection_posts
  FOR DELETE
  USING (collection_id IN (
    SELECT id FROM public.post_collections WHERE user_id = auth.uid()
  ));

-- Trigger for updated_at
CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON public.post_collections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();