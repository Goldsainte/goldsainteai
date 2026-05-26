
-- Track Unsplash photo usage per city to prevent duplicate covers
CREATE TABLE IF NOT EXISTS public.city_image_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_slug TEXT NOT NULL,
  unsplash_photo_id TEXT NOT NULL,
  unsplash_url TEXT NOT NULL,
  photographer TEXT,
  used_count INTEGER DEFAULT 1,
  last_used_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(city_slug, unsplash_photo_id)
);

CREATE INDEX IF NOT EXISTS idx_city_image_city_slug ON public.city_image_usage(city_slug);

-- RLS: public read, service-role write
ALTER TABLE public.city_image_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read city image usage"
  ON public.city_image_usage FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert city image usage"
  ON public.city_image_usage FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update city image usage"
  ON public.city_image_usage FOR UPDATE
  USING (true)
  WITH CHECK (true);

