-- Temporarily drop the constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_account_type_check;

-- Update all existing rows FIRST before adding new constraint
UPDATE profiles 
SET account_type = CASE
  WHEN account_type = 'user' THEN 'personal'
  WHEN account_type = 'verified' THEN 'creator'
  WHEN account_type IN ('business', 'creator') THEN account_type
  ELSE 'personal'
END;

-- Set default for new rows
ALTER TABLE profiles 
ALTER COLUMN account_type SET DEFAULT 'personal';

-- Now add the constraint
ALTER TABLE profiles 
ADD CONSTRAINT profiles_account_type_check 
CHECK (account_type IN ('personal', 'creator', 'business'));

-- Add show_account_type preference
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS show_account_type BOOLEAN DEFAULT false;

-- Add business verification flag
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_business_verified BOOLEAN DEFAULT false;

-- Create business verifications table
CREATE TABLE IF NOT EXISTS business_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_name TEXT NOT NULL,
  registration_number TEXT,
  tax_id TEXT,
  business_address JSONB,
  business_license_url TEXT,
  registration_document_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE business_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own business verifications"
  ON business_verifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create own business verifications"
  ON business_verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all business verifications"
  ON business_verifications FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update business verifications"
  ON business_verifications FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO storage.buckets (id, name, public)
VALUES ('business-verification-documents', 'business-verification-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users upload own business docs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'business-verification-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users view own business docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'business-verification-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins view all business docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'business-verification-documents' AND
    has_role(auth.uid(), 'admin'::app_role)
  );