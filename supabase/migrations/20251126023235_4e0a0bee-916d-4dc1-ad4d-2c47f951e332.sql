-- ============================================================================
-- MIGRATION: Add missing columns to agent_applications table
-- ============================================================================

-- 1. ADD EXTENDED DATA COLUMN (JSONB for all extra fields)
ALTER TABLE agent_applications
  ADD COLUMN IF NOT EXISTS extended_data JSONB DEFAULT '{}';

COMMENT ON COLUMN agent_applications.extended_data IS 
  'Stores additional application data: travel experience, sales metrics, technology stack, emergency contacts, legal compliance, etc.';

-- 2. ADD COMMONLY QUERIED FIELDS AS DEDICATED COLUMNS
-- Personal
ALTER TABLE agent_applications
  ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Business
ALTER TABLE agent_applications
  ADD COLUMN IF NOT EXISTS year_established INTEGER;

-- Goldsainte-specific
ALTER TABLE agent_applications
  ADD COLUMN IF NOT EXISTS why_goldsainte TEXT,
  ADD COLUMN IF NOT EXISTS average_trip_value TEXT,
  ADD COLUMN IF NOT EXISTS monthly_bookings TEXT,
  ADD COLUMN IF NOT EXISTS primary_focus TEXT[] DEFAULT '{}';

-- Sales metrics
ALTER TABLE agent_applications
  ADD COLUMN IF NOT EXISTS annual_sales_volume TEXT,
  ADD COLUMN IF NOT EXISTS active_clients_count INTEGER,
  ADD COLUMN IF NOT EXISTS repeat_clients_percentage INTEGER;

-- Host agency
ALTER TABLE agent_applications
  ADD COLUMN IF NOT EXISTS host_agency_name TEXT;

-- Content creation
ALTER TABLE agent_applications
  ADD COLUMN IF NOT EXISTS content_creation_experience BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS video_content_creation BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS social_media_followers_total INTEGER;

-- Document storage paths
ALTER TABLE agent_applications
  ADD COLUMN IF NOT EXISTS document_business_license TEXT,
  ADD COLUMN IF NOT EXISTS document_insurance_cert TEXT,
  ADD COLUMN IF NOT EXISTS document_government_id TEXT,
  ADD COLUMN IF NOT EXISTS document_headshot TEXT;

-- 3. ADD INDEXES FOR NEW COLUMNS
CREATE INDEX IF NOT EXISTS idx_agent_applications_annual_sales 
  ON agent_applications(annual_sales_volume) 
  WHERE annual_sales_volume IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_agent_applications_host_agency 
  ON agent_applications(host_agency_name) 
  WHERE host_agency_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_agent_applications_content_creator 
  ON agent_applications(content_creation_experience) 
  WHERE content_creation_experience = true;

CREATE INDEX IF NOT EXISTS idx_agent_applications_social_followers 
  ON agent_applications(social_media_followers_total) 
  WHERE social_media_followers_total IS NOT NULL;

-- 4. ADD GIN INDEX FOR JSONB COLUMNS
CREATE INDEX IF NOT EXISTS idx_agent_applications_extended_data 
  ON agent_applications USING GIN (extended_data);

CREATE INDEX IF NOT EXISTS idx_agent_applications_social_media 
  ON agent_applications USING GIN (social_media);

CREATE INDEX IF NOT EXISTS idx_agent_applications_certifications 
  ON agent_applications USING GIN (certifications);

-- 5. ENSURE RLS POLICIES FOR ANONYMOUS SUBMISSIONS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'agent_applications' 
    AND policyname = 'Anyone can submit an agent application'
  ) THEN
    CREATE POLICY "Anyone can submit an agent application"
      ON agent_applications FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- 6. GRANT PERMISSIONS
GRANT INSERT ON agent_applications TO anon;
GRANT SELECT ON agent_applications TO anon;
GRANT INSERT ON agent_applications TO authenticated;
GRANT SELECT, UPDATE ON agent_applications TO authenticated;