-- =========================================================================
-- Message attachments: private storage bucket + access policies
-- Run once in the Supabase SQL editor. Safe to re-run (idempotent).
-- Mirror this file at supabase/manual/message-attachments-bucket.sql
-- =========================================================================

-- 0. Ensure the attachments column exists on direct_messages (the generated
--    types say it does; this is harmless if so, self-healing if not).
ALTER TABLE public.direct_messages ADD COLUMN IF NOT EXISTS attachments jsonb;

-- 1. Private bucket: 10 MB limit, documents and images only.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-attachments', 'message-attachments', false, 10485760,
  ARRAY['application/pdf','image/png','image/jpeg','image/webp','image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Policies (drop-then-create so re-running never errors).
DROP POLICY IF EXISTS "msg attach: senders upload to own folder" ON storage.objects;
CREATE POLICY "msg attach: senders upload to own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'message-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "msg attach: participants read" ON storage.objects;
CREATE POLICY "msg attach: participants read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'message-attachments'
  AND (
    -- the uploader can always read their own files
    (storage.foldername(name))[1] = auth.uid()::text
    -- and so can anyone in a conversation containing a message that
    -- references this file
    OR EXISTS (
      SELECT 1
      FROM public.direct_messages dm
      JOIN public.dm_conversations c ON c.id = dm.conversation_id
      WHERE auth.uid() IN (c.participant_1, c.participant_2)
        AND dm.attachments::jsonb @> jsonb_build_array(
              jsonb_build_object('path', storage.objects.name)
            )
    )
  )
);

DROP POLICY IF EXISTS "msg attach: senders delete own" ON storage.objects;
CREATE POLICY "msg attach: senders delete own"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'message-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Verify: should return the bucket row and 3 policies.
SELECT id, public, file_size_limit FROM storage.buckets WHERE id = 'message-attachments';
SELECT policyname FROM pg_policies
WHERE tablename = 'objects' AND policyname LIKE 'msg attach%';
