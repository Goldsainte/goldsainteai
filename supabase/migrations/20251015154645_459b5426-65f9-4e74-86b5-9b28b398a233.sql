-- Create vendor-documents storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vendor-documents',
  'vendor-documents',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
);

-- RLS Policies for vendor-documents bucket
CREATE POLICY "Users can upload their own vendor documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'vendor-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own vendor documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'vendor-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own vendor documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'vendor-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all vendor documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'vendor-documents' AND has_role(auth.uid(), 'admin'::app_role));

-- Table to track vendor document uploads
CREATE TABLE IF NOT EXISTS public.vendor_document_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('insurance', 'driver_license')),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS Policies for vendor_document_uploads
ALTER TABLE public.vendor_document_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own document uploads"
ON public.vendor_document_uploads FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own document uploads"
ON public.vendor_document_uploads FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own document uploads"
ON public.vendor_document_uploads FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all document uploads"
ON public.vendor_document_uploads FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));