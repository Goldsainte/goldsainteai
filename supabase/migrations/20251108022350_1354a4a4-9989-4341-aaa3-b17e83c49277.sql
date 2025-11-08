-- Create storage bucket for trip files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'trip-files',
  'trip-files',
  false,
  10485760, -- 10MB limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ]
);

-- Add file fields to trip_messages table
ALTER TABLE public.trip_messages
ADD COLUMN file_url TEXT,
ADD COLUMN file_name TEXT,
ADD COLUMN file_type TEXT,
ADD COLUMN file_size INTEGER;

-- Storage policies for trip files
-- Members can view files from trips they're part of
CREATE POLICY "Members can view trip files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'trip-files' AND
    EXISTS (
      SELECT 1 FROM public.trip_messages tm
      JOIN public.trip_members tmem ON tm.trip_id = tmem.trip_id
      WHERE storage.filename(name) = tm.id::text
        AND tmem.user_id = auth.uid()
        AND tmem.status = 'accepted'
    )
  );

-- Members can upload files to trips they're part of
CREATE POLICY "Members can upload trip files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'trip-files' AND
    auth.uid() IS NOT NULL
  );

-- Users can delete their own files
CREATE POLICY "Users can delete own trip files"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'trip-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );