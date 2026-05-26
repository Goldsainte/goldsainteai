
-- AUTHORS
CREATE TABLE IF NOT EXISTS public.newsroom_authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  full_name text NOT NULL,
  title text NOT NULL,
  bio text NOT NULL,
  avatar_url text,
  email text,
  linkedin_url text,
  twitter_url text,
  quote text,
  expertise text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ARTICLES
CREATE TABLE IF NOT EXISTS public.newsroom_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('press_release','news','announcement')),
  title text NOT NULL,
  subtitle text,
  excerpt text NOT NULL,
  body text NOT NULL,
  hero_image_url text,
  hero_image_alt text,
  hero_image_credit text,
  author_id uuid REFERENCES public.newsroom_authors(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  published_at timestamptz,
  meta_title text,
  meta_description text,
  og_image_url text,
  canonical_url text,
  category text,
  tags text[] DEFAULT ARRAY[]::text[],
  dateline_location text,
  press_contact_name text,
  press_contact_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_newsroom_articles_published ON public.newsroom_articles(published_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_newsroom_articles_type ON public.newsroom_articles(type) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_newsroom_articles_slug ON public.newsroom_articles(slug);

-- PRESS INQUIRIES
CREATE TABLE IF NOT EXISTS public.press_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_name text NOT NULL,
  publication text NOT NULL,
  email text NOT NULL,
  phone text,
  topic text NOT NULL,
  deadline date NOT NULL,
  message text NOT NULL,
  handled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- SUBSCRIBERS
CREATE TABLE IF NOT EXISTS public.newsroom_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- TRIGGERS
CREATE TRIGGER trg_newsroom_authors_updated BEFORE UPDATE ON public.newsroom_authors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_newsroom_articles_updated BEFORE UPDATE ON public.newsroom_articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.newsroom_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsroom_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.press_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsroom_subscribers ENABLE ROW LEVEL SECURITY;

-- Authors: public read, admin write
CREATE POLICY "newsroom_authors_public_read" ON public.newsroom_authors FOR SELECT USING (true);
CREATE POLICY "newsroom_authors_admin_all" ON public.newsroom_authors FOR ALL
  USING (public.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

-- Articles: published readable to all, admins manage all + see drafts
CREATE POLICY "newsroom_articles_public_read" ON public.newsroom_articles FOR SELECT
  USING (status = 'published' OR public.has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "newsroom_articles_admin_all" ON public.newsroom_articles FOR ALL
  USING (public.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

-- Press inquiries: anyone can submit, only admins can read
CREATE POLICY "press_inquiries_public_insert" ON public.press_inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "press_inquiries_admin_read" ON public.press_inquiries FOR SELECT
  USING (public.has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "press_inquiries_admin_update" ON public.press_inquiries FOR UPDATE
  USING (public.has_role(auth.uid(),'admin'::app_role));

-- Subscribers
CREATE POLICY "newsroom_subscribers_public_insert" ON public.newsroom_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "newsroom_subscribers_admin_read" ON public.newsroom_subscribers FOR SELECT
  USING (public.has_role(auth.uid(),'admin'::app_role));

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('newsroom-media','newsroom-media', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "newsroom_media_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'newsroom-media');
CREATE POLICY "newsroom_media_admin_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'newsroom-media' AND public.has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "newsroom_media_admin_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'newsroom-media' AND public.has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "newsroom_media_admin_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'newsroom-media' AND public.has_role(auth.uid(),'admin'::app_role));

