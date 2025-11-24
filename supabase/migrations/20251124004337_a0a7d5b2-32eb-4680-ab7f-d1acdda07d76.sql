-- Add comprehensive agent application fields
-- Personal Information
ALTER TABLE agent_applications
  ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Business Information
ALTER TABLE agent_applications
  ADD COLUMN IF NOT EXISTS business_type TEXT CHECK (business_type IN ('sole_proprietor', 'partnership', 'llc', 'corporation')),
  ADD COLUMN IF NOT EXISTS business_address TEXT,
  ADD COLUMN IF NOT EXISTS business_city TEXT,
  ADD COLUMN IF NOT EXISTS business_state TEXT,
  ADD COLUMN IF NOT EXISTS business_zip TEXT,
  ADD COLUMN IF NOT EXISTS business_country TEXT DEFAULT 'US',
  ADD COLUMN IF NOT EXISTS year_established INTEGER;

-- Professional Credentials (some already exist)
ALTER TABLE agent_applications
  ADD COLUMN IF NOT EXISTS iata_number TEXT,
  ADD COLUMN IF NOT EXISTS arc_number TEXT,
  ADD COLUMN IF NOT EXISTS clia_number TEXT,
  ADD COLUMN IF NOT EXISTS other_certifications TEXT;

-- Licensing & Registration
ALTER TABLE agent_applications
  ADD COLUMN IF NOT EXISTS seller_of_travel_license TEXT,
  ADD COLUMN IF NOT EXISTS seller_of_travel_state TEXT,
  ADD COLUMN IF NOT EXISTS business_license_number TEXT,
  ADD COLUMN IF NOT EXISTS tax_id_ein TEXT;

-- Financial Information
ALTER TABLE agent_applications
  ADD COLUMN IF NOT EXISTS annual_revenue TEXT,
  ADD COLUMN IF NOT EXISTS has_eo_insurance BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS insurance_provider TEXT,
  ADD COLUMN IF NOT EXISTS insurance_policy_number TEXT,
  ADD COLUMN IF NOT EXISTS insurance_coverage TEXT;

-- Professional References
ALTER TABLE agent_applications
  ADD COLUMN IF NOT EXISTS reference1_name TEXT,
  ADD COLUMN IF NOT EXISTS reference1_company TEXT,
  ADD COLUMN IF NOT EXISTS reference1_email TEXT,
  ADD COLUMN IF NOT EXISTS reference1_phone TEXT,
  ADD COLUMN IF NOT EXISTS reference2_name TEXT,
  ADD COLUMN IF NOT EXISTS reference2_company TEXT,
  ADD COLUMN IF NOT EXISTS reference2_email TEXT,
  ADD COLUMN IF NOT EXISTS reference2_phone TEXT;

-- Banking Information
ALTER TABLE agent_applications
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS account_holder_name TEXT,
  ADD COLUMN IF NOT EXISTS account_type TEXT CHECK (account_type IN ('checking', 'savings')),
  ADD COLUMN IF NOT EXISTS routing_number TEXT,
  ADD COLUMN IF NOT EXISTS account_number_last4 TEXT;

-- Goldsainte-Specific Fields
ALTER TABLE agent_applications
  ADD COLUMN IF NOT EXISTS primary_focus TEXT[],
  ADD COLUMN IF NOT EXISTS average_trip_value TEXT,
  ADD COLUMN IF NOT EXISTS monthly_bookings TEXT,
  ADD COLUMN IF NOT EXISTS preferred_destinations TEXT,
  ADD COLUMN IF NOT EXISTS why_goldsainte TEXT;

-- Document Storage Paths
ALTER TABLE agent_applications
  ADD COLUMN IF NOT EXISTS business_license_document TEXT,
  ADD COLUMN IF NOT EXISTS insurance_certificate_document TEXT,
  ADD COLUMN IF NOT EXISTS government_id_document TEXT,
  ADD COLUMN IF NOT EXISTS headshot_photo TEXT;

-- Application Tracking (admin_status already exists, but add submitted_at)
ALTER TABLE agent_applications
  ADD COLUMN IF NOT EXISTS application_status TEXT DEFAULT 'pending_review',
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_agent_applications_application_status ON agent_applications(application_status);
CREATE INDEX IF NOT EXISTS idx_agent_applications_submitted_at ON agent_applications(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_applications_email_status ON agent_applications(email, application_status);

-- Create storage bucket for application documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'application-documents',
  'application-documents',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for storage bucket
DROP POLICY IF EXISTS "Anyone can upload application documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view their own application documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all application documents" ON storage.objects;

CREATE POLICY "Anyone can upload application documents"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'application-documents');

CREATE POLICY "Anyone can view own application documents"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'application-documents');

CREATE POLICY "Admins view all application documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'application-documents' 
    AND EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() 
      AND (can_approve_agents = true OR is_super_admin = true)
    )
  );