-- Rename the table to avoid conflict with existing marketplace packages
ALTER TABLE public.travel_packages RENAME TO ai_bundled_packages;

-- Update the RLS policies to reference the new table name
DROP POLICY IF EXISTS "Users can view own packages" ON public.ai_bundled_packages;
DROP POLICY IF EXISTS "Users can create own packages" ON public.ai_bundled_packages;
DROP POLICY IF EXISTS "Users can update own packages" ON public.ai_bundled_packages;
DROP POLICY IF EXISTS "Users can delete own packages" ON public.ai_bundled_packages;

CREATE POLICY "Users can view own packages"
  ON public.ai_bundled_packages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own packages"
  ON public.ai_bundled_packages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own packages"
  ON public.ai_bundled_packages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own packages"
  ON public.ai_bundled_packages FOR DELETE
  USING (auth.uid() = user_id);