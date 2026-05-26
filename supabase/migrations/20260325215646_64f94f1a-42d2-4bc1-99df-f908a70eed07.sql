
CREATE TABLE IF NOT EXISTS public.creator_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  source TEXT NOT NULL DEFAULT 'upload' CHECK (source IN ('upload', 'instagram', 'tiktok')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  external_id TEXT,
  external_url TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.creator_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read creator_media" ON public.creator_media FOR SELECT USING (true);

CREATE POLICY "Owner insert creator_media" ON public.creator_media FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner update creator_media" ON public.creator_media FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Owner delete creator_media" ON public.creator_media FOR DELETE USING (auth.uid() = user_id);
