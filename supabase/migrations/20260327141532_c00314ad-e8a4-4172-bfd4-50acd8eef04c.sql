
-- Create creator_services table for Fiverr-style service packages
CREATE TABLE IF NOT EXISTS public.creator_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  starting_price_cents BIGINT DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  delivery_days INTEGER,
  includes JSONB DEFAULT '[]'::jsonb,
  revisions INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.creator_services ENABLE ROW LEVEL SECURITY;

-- Public can read active services
CREATE POLICY "Anyone can view active services"
  ON public.creator_services FOR SELECT
  USING (is_active = true);

-- Creator can manage own services
CREATE POLICY "Creator can manage own services"
  ON public.creator_services FOR ALL
  TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());
