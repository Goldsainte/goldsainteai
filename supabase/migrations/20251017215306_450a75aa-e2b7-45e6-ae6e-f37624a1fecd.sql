-- Create dispute submissions table
CREATE TABLE IF NOT EXISTS public.dispute_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  booking_reference TEXT,
  dispute_type TEXT NOT NULL,
  description TEXT NOT NULL,
  preferred_contact_method TEXT DEFAULT 'email',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dispute_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own submissions
CREATE POLICY "Users can create dispute submissions"
ON public.dispute_submissions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own submissions
CREATE POLICY "Users can view own dispute submissions"
ON public.dispute_submissions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Admins can view all submissions
CREATE POLICY "Admins can view all dispute submissions"
ON public.dispute_submissions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Policy: Admins can update all submissions
CREATE POLICY "Admins can update dispute submissions"
ON public.dispute_submissions
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_dispute_submissions_updated_at
BEFORE UPDATE ON public.dispute_submissions
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

-- Create storage bucket for dispute documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('dispute-documents', 'dispute-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload dispute documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'dispute-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own dispute documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'dispute-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all dispute documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'dispute-documents' AND has_role(auth.uid(), 'admin'));