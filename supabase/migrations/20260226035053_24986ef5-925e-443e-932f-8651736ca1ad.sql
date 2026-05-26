
-- Create proposal_attachments table
CREATE TABLE IF NOT EXISTS public.proposal_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES public.trip_proposals(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for proposal_attachments
ALTER TABLE public.proposal_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own attachments"
  ON public.proposal_attachments FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can view their own attachments"
  ON public.proposal_attachments FOR SELECT
  USING (auth.uid() = uploaded_by);

CREATE POLICY "Admins can view all attachments"
  ON public.proposal_attachments FOR SELECT
  USING (public.is_admin());

-- Create storage bucket for proposal attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('proposal-attachments', 'proposal-attachments', false);

-- Storage RLS policies
CREATE POLICY "Authenticated users can upload proposal attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'proposal-attachments'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can view their own proposal attachments"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'proposal-attachments'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete their own proposal attachments"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'proposal-attachments'
    AND auth.role() = 'authenticated'
  );
