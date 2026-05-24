
-- 1) Revoke direct SELECT on the email column of newsroom_authors
REVOKE SELECT (email) ON public.newsroom_authors FROM anon, authenticated;

-- 2) Brand collections storage bucket: enforce authenticated + owner folder
DROP POLICY IF EXISTS "Anyone can upload brand application media" ON storage.objects;

CREATE POLICY "Authenticated users upload own brand media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'brand-collections'
  AND (storage.foldername(name))[1] = 'brand-media'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- 3) Job attachments storage: allow job participants to view, not just uploader
DROP POLICY IF EXISTS "job_attachments_view_participants" ON storage.objects;

CREATE POLICY "job_attachments_view_participants"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'job-attachments'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.marketplace_jobs mj
      WHERE mj.id::text = (storage.foldername(name))[1]
        AND (mj.user_id = auth.uid() OR mj.assigned_agent_id = auth.uid())
    )
  )
);

-- 4) Trips table: restrict "open trips" public visibility to authenticated users
DROP POLICY IF EXISTS "Anyone can view open trips" ON public.trips;

CREATE POLICY "Authenticated users can view open trips"
ON public.trips
FOR SELECT
TO authenticated
USING (status = 'open');
