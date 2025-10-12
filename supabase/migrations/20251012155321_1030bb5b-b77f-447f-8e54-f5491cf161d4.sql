-- Create storage bucket for user content (videos and images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-content',
  'user-content',
  true,
  524288000, -- 500MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm']
);

-- Allow authenticated users to upload their own content
CREATE POLICY "Users can upload their own content"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-content' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to view their own content
CREATE POLICY "Users can view their own content"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-content' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public access to all content in this bucket
CREATE POLICY "Public access to user content"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'user-content');

-- Allow users to delete their own content
CREATE POLICY "Users can delete their own content"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-content' AND
  auth.uid()::text = (storage.foldername(name))[1]
);