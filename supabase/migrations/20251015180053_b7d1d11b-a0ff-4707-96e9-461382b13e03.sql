-- Make vendor and verification buckets public and add storage policies for uploads/removals

-- 1) Ensure buckets are public so getPublicUrl works
UPDATE storage.buckets SET public = true WHERE id IN ('vendor-documents', 'verification-documents');

-- 2) Policies for vendor-documents bucket
DO $$
BEGIN
  -- Public read (needed for public URLs and listing via API)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read vendor-documents'
  ) THEN
    CREATE POLICY "Public read vendor-documents"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'vendor-documents');
  END IF;

  -- Authenticated users can upload to their own folder (first path segment = auth.uid())
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can upload own vendor-documents'
  ) THEN
    CREATE POLICY "Users can upload own vendor-documents"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
      bucket_id = 'vendor-documents'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  -- Authenticated users can update their own files
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can update own vendor-documents'
  ) THEN
    CREATE POLICY "Users can update own vendor-documents"
    ON storage.objects
    FOR UPDATE
    USING (
      bucket_id = 'vendor-documents'
      AND auth.uid()::text = (storage.foldername(name))[1]
    )
    WITH CHECK (
      bucket_id = 'vendor-documents'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  -- Authenticated users can delete their own files
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can delete own vendor-documents'
  ) THEN
    CREATE POLICY "Users can delete own vendor-documents"
    ON storage.objects
    FOR DELETE
    USING (
      bucket_id = 'vendor-documents'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;

-- 3) Policies for verification-documents bucket
DO $$
BEGIN
  -- Public read (aligns with current frontend using getPublicUrl)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read verification-documents'
  ) THEN
    CREATE POLICY "Public read verification-documents"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'verification-documents');
  END IF;

  -- Authenticated users can upload to their own folder
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can upload own verification-documents'
  ) THEN
    CREATE POLICY "Users can upload own verification-documents"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
      bucket_id = 'verification-documents'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  -- Authenticated users can update their own files
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can update own verification-documents'
  ) THEN
    CREATE POLICY "Users can update own verification-documents"
    ON storage.objects
    FOR UPDATE
    USING (
      bucket_id = 'verification-documents'
      AND auth.uid()::text = (storage.foldername(name))[1]
    )
    WITH CHECK (
      bucket_id = 'verification-documents'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  -- Authenticated users can delete their own files
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can delete own verification-documents'
  ) THEN
    CREATE POLICY "Users can delete own verification-documents"
    ON storage.objects
    FOR DELETE
    USING (
      bucket_id = 'verification-documents'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;