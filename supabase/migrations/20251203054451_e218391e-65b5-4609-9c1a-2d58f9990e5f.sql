-- Clean up duplicate storage policies on avatars bucket
-- Drop all existing policies first, then recreate clean ones

DO $$
BEGIN
  -- Drop all existing avatar policies (handles duplicates)
  DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated uploads_17c55b09" ON storage.objects;
  DROP POLICY IF EXISTS "Allow public viewing" ON storage.objects;
  DROP POLICY IF EXISTS "Allow public viewing_62dae82b" ON storage.objects;
  DROP POLICY IF EXISTS "Allow users to update their own avatar" ON storage.objects;
  DROP POLICY IF EXISTS "Allow users to update their own avatar_8d68a39f" ON storage.objects;
  DROP POLICY IF EXISTS "Allow users to delete their own avatar" ON storage.objects;
  DROP POLICY IF EXISTS "Allow users to delete their own avatar_f83cf14e" ON storage.objects;
  DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
  DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
END $$;

-- Create clean, non-duplicate policies for avatars bucket
CREATE POLICY "avatars_public_select"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "avatars_authenticated_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "avatars_authenticated_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "avatars_authenticated_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);