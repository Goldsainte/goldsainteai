-- Create journal_creators table (author profiles)
CREATE TABLE IF NOT EXISTS public.journal_creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  social_links JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create journal_articles table (main article table)
CREATE TABLE IF NOT EXISTS public.journal_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  dek TEXT,
  creator_id UUID REFERENCES public.journal_creators(id) ON DELETE SET NULL,
  hero_image_url TEXT NOT NULL,
  hero_image_alt TEXT,
  hero_image_credit TEXT,
  publish_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  read_time_minutes INTEGER,
  categories TEXT[] DEFAULT '{}',
  location_tags TEXT[] DEFAULT '{}',
  is_sponsored BOOLEAN DEFAULT false,
  sponsor_name TEXT,
  sponsor_logo_url TEXT,
  sponsor_link_url TEXT,
  sponsor_disclosure_text TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'published')),
  meta_title TEXT,
  meta_description TEXT,
  og_image_url TEXT,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create journal_article_blocks table (rich content blocks)
CREATE TABLE IF NOT EXISTS public.journal_article_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.journal_articles(id) ON DELETE CASCADE NOT NULL,
  block_order INTEGER NOT NULL,
  block_type TEXT NOT NULL CHECK (block_type IN ('paragraph', 'h2', 'h3', 'pullquote', 'image', 'gallery', 'embed', 'cta')),
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create journal_related_articles table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.journal_related_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.journal_articles(id) ON DELETE CASCADE NOT NULL,
  related_article_id UUID REFERENCES public.journal_articles(id) ON DELETE CASCADE NOT NULL,
  display_order INTEGER DEFAULT 0
);

-- Create journal_analytics table (view tracking)
CREATE TABLE IF NOT EXISTS public.journal_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.journal_articles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  view_duration_seconds INTEGER,
  scroll_depth_percent INTEGER,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_journal_articles_slug ON public.journal_articles(slug);
CREATE INDEX IF NOT EXISTS idx_journal_articles_status ON public.journal_articles(status);
CREATE INDEX IF NOT EXISTS idx_journal_articles_publish_date ON public.journal_articles(publish_date DESC);
CREATE INDEX IF NOT EXISTS idx_journal_articles_creator ON public.journal_articles(creator_id);
CREATE INDEX IF NOT EXISTS idx_journal_article_blocks_article ON public.journal_article_blocks(article_id, block_order);
CREATE INDEX IF NOT EXISTS idx_journal_analytics_article ON public.journal_analytics(article_id);
CREATE INDEX IF NOT EXISTS idx_journal_creators_slug ON public.journal_creators(slug);

-- Enable Row Level Security
ALTER TABLE public.journal_creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_article_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_related_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for journal_creators
CREATE POLICY "Anyone can view creators"
  ON public.journal_creators FOR SELECT
  USING (true);

CREATE POLICY "Users can create creator profile"
  ON public.journal_creators FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own creator profile"
  ON public.journal_creators FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for journal_articles
CREATE POLICY "Anyone can view published articles"
  ON public.journal_articles FOR SELECT
  USING (status = 'published');

CREATE POLICY "Creators can view own articles"
  ON public.journal_articles FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.journal_creators WHERE id = creator_id
    )
  );

CREATE POLICY "Creators can insert own articles"
  ON public.journal_articles FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.journal_creators WHERE id = creator_id
    )
  );

CREATE POLICY "Creators can update own articles"
  ON public.journal_articles FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.journal_creators WHERE id = creator_id
    )
  );

CREATE POLICY "Admins can manage all articles"
  ON public.journal_articles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for journal_article_blocks
CREATE POLICY "Anyone can view blocks of published articles"
  ON public.journal_article_blocks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.journal_articles
      WHERE id = article_id AND status = 'published'
    )
  );

CREATE POLICY "Creators can manage blocks of own articles"
  ON public.journal_article_blocks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.journal_articles a
      JOIN public.journal_creators c ON a.creator_id = c.id
      WHERE a.id = article_id AND c.user_id = auth.uid()
    )
  );

-- RLS Policies for journal_related_articles
CREATE POLICY "Anyone can view related articles"
  ON public.journal_related_articles FOR SELECT
  USING (true);

CREATE POLICY "Creators can manage related articles"
  ON public.journal_related_articles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.journal_articles a
      JOIN public.journal_creators c ON a.creator_id = c.id
      WHERE a.id = article_id AND c.user_id = auth.uid()
    )
  );

-- RLS Policies for journal_analytics
CREATE POLICY "Anyone can insert analytics"
  ON public.journal_analytics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own analytics"
  ON public.journal_analytics FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Trigger for updated_at
CREATE TRIGGER update_journal_creators_updated_at
  BEFORE UPDATE ON public.journal_creators
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_journal_articles_updated_at
  BEFORE UPDATE ON public.journal_articles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
