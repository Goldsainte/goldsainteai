
-- 1. Rewrite admin authority functions to use user_roles only
CREATE OR REPLACE FUNCTION public.is_super_admin(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT public.has_role(p_user_id, 'admin'::app_role) $$;

CREATE OR REPLACE FUNCTION public.can_approve_agents(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT public.has_role(p_user_id, 'admin'::app_role) $$;

CREATE OR REPLACE FUNCTION public.can_approve_brands(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT public.has_role(p_user_id, 'admin'::app_role) $$;

-- 2. processed_payments: remove the NULL user_id leak
DROP POLICY IF EXISTS "Users can view own processed payments" ON public.processed_payments;
CREATE POLICY "Users can view own processed payments"
ON public.processed_payments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can view all processed payments"
ON public.processed_payments FOR SELECT
USING (auth.role() = 'service_role');

-- 3. newsroom_authors: hide email from public; expose a safe view
DROP POLICY IF EXISTS "newsroom_authors_public_read" ON public.newsroom_authors;

CREATE OR REPLACE VIEW public.newsroom_authors_public
WITH (security_invoker = off) AS
SELECT id, slug, full_name, title, bio, avatar_url, linkedin_url,
       twitter_url, quote, expertise, created_at, updated_at, signature_image_url
FROM public.newsroom_authors;

GRANT SELECT ON public.newsroom_authors_public TO anon, authenticated;

-- Keep admin full access (admin_all policy already covers it). Authenticated/anon
-- callers must read via the view; admin pages keep using the table via admin_all.
CREATE POLICY "newsroom_authors_authenticated_safe_read"
ON public.newsroom_authors FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Storage: enforce folder-owner scoping on INSERT
DROP POLICY IF EXISTS "Anyone can upload application documents" ON storage.objects;
CREATE POLICY "Users upload application documents to own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'application-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Authenticated users can upload journal images" ON storage.objects;
CREATE POLICY "Authenticated users can upload journal images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'journal-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Authenticated users can upload trip assets" ON storage.objects;
CREATE POLICY "Authenticated users can upload trip assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'trip-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Authenticated users can upload vendor promotion media" ON storage.objects;
CREATE POLICY "Authenticated users can upload vendor promotion media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'vendor-promotions'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
