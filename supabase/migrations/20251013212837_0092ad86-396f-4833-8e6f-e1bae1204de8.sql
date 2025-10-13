-- Create storage bucket for email assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'email-assets',
  'email-assets',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Anyone can view email assets
CREATE POLICY "Public read access for email assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'email-assets');

-- RLS Policy: Only service role can upload email assets
CREATE POLICY "Service role can upload email assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'email-assets' AND
    ((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'service_role'
  );