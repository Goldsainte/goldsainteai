-- Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('trip-assets', 'trip-assets', true);

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload trip assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'trip-assets');

-- Allow public read access
CREATE POLICY "Public read access for trip assets"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'trip-assets');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own trip assets"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'trip-assets');