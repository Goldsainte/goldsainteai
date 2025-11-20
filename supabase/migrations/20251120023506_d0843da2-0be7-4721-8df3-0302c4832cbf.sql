-- Create brand-collections storage bucket for collection cover images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'brand-collections',
  'brand-collections',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Public read access for collection cover images
CREATE POLICY "Anyone can view brand collection images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'brand-collections');

-- RLS Policy: Users can upload to their own collections only
CREATE POLICY "Users can upload to their own collections"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'brand-collections'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 
    FROM public.brand_collections bc
    JOIN public.profiles p ON p.id = bc.brand_profile_id
    WHERE bc.id::text = (storage.foldername(name))[1]
      AND p.id = auth.uid()
  )
);

-- RLS Policy: Users can update their own collection images
CREATE POLICY "Users can update their own collection images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'brand-collections'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 
    FROM public.brand_collections bc
    JOIN public.profiles p ON p.id = bc.brand_profile_id
    WHERE bc.id::text = (storage.foldername(name))[1]
      AND p.id = auth.uid()
  )
);

-- RLS Policy: Users can delete their own collection images
CREATE POLICY "Users can delete their own collection images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'brand-collections'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 
    FROM public.brand_collections bc
    JOIN public.profiles p ON p.id = bc.brand_profile_id
    WHERE bc.id::text = (storage.foldername(name))[1]
      AND p.id = auth.uid()
  )
);