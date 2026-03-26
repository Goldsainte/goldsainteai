
-- 1. Create SECURITY DEFINER function to check storyboard ownership without triggering RLS
CREATE OR REPLACE FUNCTION public.is_storyboard_owner(storyboard_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.storyboards
    WHERE id = storyboard_uuid AND owner_id = user_uuid
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_storyboard_owner FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_storyboard_owner TO authenticated;

-- 2. Drop and re-create storyboard_items policies using the helper function
DROP POLICY IF EXISTS "Users can view items in accessible storyboards" ON public.storyboard_items;
CREATE POLICY "Users can view items in accessible storyboards"
  ON public.storyboard_items FOR SELECT
  TO authenticated
  USING (
    public.is_storyboard_owner(storyboard_id, auth.uid())
    OR public.is_storyboard_collaborator(storyboard_id, auth.uid())
  );

DROP POLICY IF EXISTS "Users can create items in their own storyboards" ON public.storyboard_items;
CREATE POLICY "Users can create items in their own storyboards"
  ON public.storyboard_items FOR INSERT
  TO authenticated
  WITH CHECK (public.is_storyboard_owner(storyboard_id, auth.uid()));

DROP POLICY IF EXISTS "Users can update items in their own storyboards" ON public.storyboard_items;
CREATE POLICY "Users can update items in their own storyboards"
  ON public.storyboard_items FOR UPDATE
  TO authenticated
  USING (public.is_storyboard_owner(storyboard_id, auth.uid()));

DROP POLICY IF EXISTS "Users can delete items in their own storyboards" ON public.storyboard_items;
CREATE POLICY "Users can delete items in their own storyboards"
  ON public.storyboard_items FOR DELETE
  TO authenticated
  USING (public.is_storyboard_owner(storyboard_id, auth.uid()));

-- 3. Fix storyboards table own UPDATE/DELETE policies to avoid recursion
DROP POLICY IF EXISTS "Owners can update their storyboards" ON public.storyboards;
CREATE POLICY "Owners can update their storyboards"
  ON public.storyboards FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners can delete their storyboards" ON public.storyboards;
CREATE POLICY "Owners can delete their storyboards"
  ON public.storyboards FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());
