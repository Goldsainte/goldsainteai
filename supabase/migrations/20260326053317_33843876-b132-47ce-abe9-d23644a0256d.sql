-- Fix storyboard_collaborators RLS recursion by using is_storyboard_owner helper

-- Drop the recursive policy
DROP POLICY IF EXISTS "Owner can manage collaborators" ON public.storyboard_collaborators;

-- Re-create using the SECURITY DEFINER helper (no recursion)
CREATE POLICY "Owner can manage collaborators"
  ON public.storyboard_collaborators FOR ALL
  TO authenticated
  USING (public.is_storyboard_owner(storyboard_id, auth.uid()))
  WITH CHECK (public.is_storyboard_owner(storyboard_id, auth.uid()));