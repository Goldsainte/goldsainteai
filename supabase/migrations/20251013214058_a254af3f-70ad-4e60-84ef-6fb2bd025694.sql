-- Drop the restrictive service role policy
DROP POLICY IF EXISTS "Service role can upload email assets" ON storage.objects;

-- Allow authenticated users to upload email assets
CREATE POLICY "Authenticated users can upload email assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'email-assets' AND
    auth.role() = 'authenticated'
  );

-- Allow authenticated users to update email assets
CREATE POLICY "Authenticated users can update email assets"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'email-assets' AND auth.role() = 'authenticated');