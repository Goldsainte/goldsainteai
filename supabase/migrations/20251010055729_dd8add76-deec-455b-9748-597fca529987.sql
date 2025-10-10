-- Create storage bucket for moments
INSERT INTO storage.buckets (id, name, public)
VALUES ('moments', 'moments', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for moments storage bucket
CREATE POLICY "Anyone can view moment files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'moments');

CREATE POLICY "Users can upload their own moment files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'moments' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own moment files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'moments' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );