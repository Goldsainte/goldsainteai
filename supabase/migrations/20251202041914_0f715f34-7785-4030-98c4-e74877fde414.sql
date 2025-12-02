-- Fix 1: Add INSERT policy for brand-collections allowing brand application uploads
CREATE POLICY "Anyone can upload brand application media"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'brand-collections' 
  AND (storage.foldername(name))[1] = 'brand-media'
);

-- Fix 2: Make application-documents bucket public so URLs are accessible
UPDATE storage.buckets SET public = true WHERE id = 'application-documents';