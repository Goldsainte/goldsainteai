
-- 1. Add status and forked_count to storyboards
ALTER TABLE public.storyboards
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS forked_count integer NOT NULL DEFAULT 0;

-- 2. Create storyboard_sections table
CREATE TABLE IF NOT EXISTS public.storyboard_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storyboard_id uuid NOT NULL REFERENCES public.storyboards(id) ON DELETE CASCADE,
  title text NOT NULL,
  section_type text NOT NULL DEFAULT 'day',
  position integer NOT NULL DEFAULT 0,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.storyboard_sections ENABLE ROW LEVEL SECURITY;

-- Sections: owner can do everything
CREATE POLICY "Owner can manage sections"
  ON public.storyboard_sections FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.storyboards WHERE id = storyboard_id AND owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.storyboards WHERE id = storyboard_id AND owner_id = auth.uid())
  );

-- Sections: public storyboards readable by all
CREATE POLICY "Public storyboard sections are readable"
  ON public.storyboard_sections FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.storyboards WHERE id = storyboard_id AND is_public = true)
  );

-- 3. Add section_id and bookable columns to storyboard_items
ALTER TABLE public.storyboard_items
  ADD COLUMN IF NOT EXISTS section_id uuid REFERENCES public.storyboard_sections(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS bookable_product_id text,
  ADD COLUMN IF NOT EXISTS bookable_product_type text;

-- 4. Create storyboard_collaborators table
CREATE TABLE IF NOT EXISTS public.storyboard_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storyboard_id uuid NOT NULL REFERENCES public.storyboards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'viewer',
  invited_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  UNIQUE(storyboard_id, user_id)
);

ALTER TABLE public.storyboard_collaborators ENABLE ROW LEVEL SECURITY;

-- Collaborators: owner can manage
CREATE POLICY "Owner can manage collaborators"
  ON public.storyboard_collaborators FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.storyboards WHERE id = storyboard_id AND owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.storyboards WHERE id = storyboard_id AND owner_id = auth.uid())
  );

-- Collaborators can see their own records
CREATE POLICY "Collaborators can see own record"
  ON public.storyboard_collaborators FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 5. RLS: collaborators can view storyboards
CREATE POLICY "Collaborators can view storyboards"
  ON public.storyboards FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.storyboard_collaborators WHERE storyboard_id = id AND user_id = auth.uid())
  );

-- 6. RLS: editor collaborators can update storyboard_items
CREATE POLICY "Editor collaborators can update items"
  ON public.storyboard_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.storyboard_collaborators
      WHERE storyboard_id = storyboard_items.storyboard_id
        AND user_id = auth.uid()
        AND role = 'editor'
    )
  );

-- 7. RLS: collaborators can view storyboard_items
CREATE POLICY "Collaborators can view items"
  ON public.storyboard_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.storyboard_collaborators
      WHERE storyboard_id = storyboard_items.storyboard_id
        AND user_id = auth.uid()
    )
  );

-- 8. RLS: editor collaborators can view sections
CREATE POLICY "Collaborators can view sections"
  ON public.storyboard_sections FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.storyboard_collaborators
      WHERE storyboard_id = storyboard_sections.storyboard_id
        AND user_id = auth.uid()
    )
  );

-- 9. editor collaborators can manage sections
CREATE POLICY "Editor collaborators can manage sections"
  ON public.storyboard_sections FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.storyboard_collaborators
      WHERE storyboard_id = storyboard_sections.storyboard_id
        AND user_id = auth.uid()
        AND role = 'editor'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.storyboard_collaborators
      WHERE storyboard_id = storyboard_sections.storyboard_id
        AND user_id = auth.uid()
        AND role = 'editor'
    )
  );

-- 10. Increment forked_count trigger
CREATE OR REPLACE FUNCTION public.increment_forked_count()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.original_storyboard_id IS NOT NULL THEN
    UPDATE public.storyboards
    SET forked_count = forked_count + 1
    WHERE id = NEW.original_storyboard_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_increment_forked_count
  AFTER INSERT ON public.storyboards
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_forked_count();
