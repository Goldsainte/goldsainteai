
-- Drop the view & the temporary policy
DROP VIEW IF EXISTS public.newsroom_authors_public;
DROP POLICY IF EXISTS "newsroom_authors_authenticated_safe_read" ON public.newsroom_authors;

-- Restore public read policy
CREATE POLICY "newsroom_authors_public_read"
ON public.newsroom_authors FOR SELECT
USING (true);

-- Column-level: hide email from anon & authenticated; only admins via SECURITY DEFINER RPC or service_role
REVOKE SELECT (email) ON public.newsroom_authors FROM anon, authenticated;

-- Admin-only RPC for fetching author records that include email (used by admin pages)
CREATE OR REPLACE FUNCTION public.admin_get_newsroom_authors()
RETURNS SETOF public.newsroom_authors
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  RETURN QUERY SELECT * FROM public.newsroom_authors ORDER BY full_name;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_newsroom_authors() FROM public;
GRANT EXECUTE ON FUNCTION public.admin_get_newsroom_authors() TO authenticated;
