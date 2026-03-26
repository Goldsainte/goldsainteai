
CREATE OR REPLACE FUNCTION public.is_storyboard_collaborator(storyboard_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.storyboard_collaborators
    WHERE storyboard_id = storyboard_uuid AND user_id = user_uuid
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_storyboard_collaborator FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_storyboard_collaborator TO authenticated;

DROP POLICY IF EXISTS "Collaborators can view storyboards" ON public.storyboards;

CREATE POLICY "Collaborators can view storyboards"
  ON public.storyboards FOR SELECT
  TO authenticated
  USING (public.is_storyboard_collaborator(id, auth.uid()));
