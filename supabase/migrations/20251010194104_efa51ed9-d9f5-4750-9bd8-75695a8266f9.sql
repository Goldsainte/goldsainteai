-- Drop tables if they exist to start fresh
DROP TABLE IF EXISTS public.promo_code_usage CASCADE;
DROP TABLE IF EXISTS public.package_post_tags CASCADE;

-- Create promo code tracking (simple version)
CREATE TABLE IF NOT EXISTS public.promo_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code TEXT NOT NULL,
  package_id UUID NOT NULL,
  user_id UUID,
  session_id TEXT,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  converted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create package post tags
CREATE TABLE IF NOT EXISTS public.package_post_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL,
  package_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add unique constraint
ALTER TABLE public.package_post_tags 
ADD CONSTRAINT package_post_tags_unique UNIQUE (post_id, package_id);

-- Enable RLS
ALTER TABLE public.promo_code_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_post_tags ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies
CREATE POLICY "promo_insert" ON public.promo_code_usage
FOR INSERT WITH CHECK (true);

CREATE POLICY "promo_select" ON public.promo_code_usage
FOR SELECT USING (true);

CREATE POLICY "tags_select" ON public.package_post_tags
FOR SELECT USING (true);

CREATE POLICY "tags_insert" ON public.package_post_tags
FOR INSERT WITH CHECK (true);

CREATE POLICY "tags_delete" ON public.package_post_tags
FOR DELETE USING (true);