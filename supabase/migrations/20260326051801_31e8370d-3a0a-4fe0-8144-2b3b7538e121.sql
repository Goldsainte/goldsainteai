
-- Add slug column to storyboards
ALTER TABLE public.storyboards ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create slug generation function
CREATE OR REPLACE FUNCTION public.generate_storyboard_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  suffix TEXT;
BEGIN
  -- Only generate if slug is null
  IF NEW.slug IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Convert title to kebab-case slug
  base_slug := lower(regexp_replace(regexp_replace(NEW.title, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  
  -- Truncate to reasonable length
  IF length(base_slug) > 50 THEN
    base_slug := left(base_slug, 50);
  END IF;
  
  -- Add random suffix for uniqueness
  suffix := substr(md5(random()::text), 1, 6);
  final_slug := base_slug || '-' || suffix;
  
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trg_generate_storyboard_slug ON public.storyboards;
CREATE TRIGGER trg_generate_storyboard_slug
  BEFORE INSERT ON public.storyboards
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_storyboard_slug();

-- Generate slugs for existing storyboards that don't have one
UPDATE public.storyboards 
SET slug = lower(regexp_replace(regexp_replace(title, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g')) || '-' || substr(md5(id::text), 1, 6)
WHERE slug IS NULL;

-- RLS: Allow anyone to SELECT public storyboards
CREATE POLICY "Anyone can view public storyboards"
  ON public.storyboards
  FOR SELECT
  TO anon, authenticated
  USING (is_public = true);

-- RLS: Allow anyone to SELECT items of public storyboards
CREATE POLICY "Anyone can view items of public storyboards"
  ON public.storyboard_items
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.storyboards s
      WHERE s.id = storyboard_id AND s.is_public = true
    )
  );
