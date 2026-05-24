
-- 1. application-documents storage: replace admin_users-based policy with has_role
DROP POLICY IF EXISTS "Admins view all application documents" ON storage.objects;
CREATE POLICY "Admins view all application documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'application-documents'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- 2. newsroom_authors: revoke email column from public roles
REVOKE SELECT (email) ON public.newsroom_authors FROM anon, authenticated;

-- 3. promo_code_usage: restrict SELECT to owner or admin
DROP POLICY IF EXISTS promo_select ON public.promo_code_usage;
CREATE POLICY promo_select_own_or_admin
ON public.promo_code_usage
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- 4. trip-files bucket: enforce path ownership on INSERT
DROP POLICY IF EXISTS "Members can upload trip files" ON storage.objects;
CREATE POLICY "Members can upload trip files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'trip-files'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

-- 5. trip_requests: remove fully-public open trip policy; keep authenticated-only access
DROP POLICY IF EXISTS "Anyone can view open trip requests" ON public.trip_requests;
