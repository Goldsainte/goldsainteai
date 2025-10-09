-- Create storage bucket for travel documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('travel-documents', 'travel-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for travel documents
CREATE POLICY "Users can upload their own travel documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'travel-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own travel documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'travel-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own travel documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'travel-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own travel documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'travel-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);