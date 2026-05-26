-- Add agent verification fields to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS account_type text CHECK (account_type IN ('traveler', 'creator', 'agent', 'admin')),
ADD COLUMN IF NOT EXISTS agent_verification_status text CHECK (agent_verification_status IN ('none', 'pending', 'verified', 'rejected')) DEFAULT 'none',
ADD COLUMN IF NOT EXISTS agent_agency_name text,
ADD COLUMN IF NOT EXISTS agent_license_number text,
ADD COLUMN IF NOT EXISTS agent_license_authority text,
ADD COLUMN IF NOT EXISTS agent_years_experience int,
ADD COLUMN IF NOT EXISTS agent_specialties text[] DEFAULT '{}';

-- Create agent_applications table
CREATE TABLE IF NOT EXISTS agent_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  agency_name text,
  license_number text,
  license_authority text,
  website text,
  instagram_handle text,
  tiktok_handle text,
  years_experience int,
  specialties text[],
  notes text,
  verification_status text CHECK (verification_status IN ('pending', 'verified', 'rejected')) DEFAULT 'pending',
  kyc_provider text,
  kyc_session_id text,
  created_at timestamptz DEFAULT now(),
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  rejection_reason text,
  UNIQUE(agent_id)
);

-- Enable RLS on agent_applications
ALTER TABLE agent_applications ENABLE ROW LEVEL SECURITY;

-- Agents can view and manage their own applications
CREATE POLICY "Agents can view own application"
  ON agent_applications FOR SELECT
  USING (auth.uid() = agent_id);

CREATE POLICY "Agents can insert own application"
  ON agent_applications FOR INSERT
  WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Agents can update own application"
  ON agent_applications FOR UPDATE
  USING (auth.uid() = agent_id);

-- Admins can view all applications
CREATE POLICY "Admins can view all applications"
  ON agent_applications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- CREATE INDEX IF NOT EXISTS for lookups
CREATE INDEX IF NOT EXISTS idx_agent_applications_agent_id ON agent_applications(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_applications_verification_status ON agent_applications(verification_status);
CREATE INDEX IF NOT EXISTS idx_profiles_agent_verification_status ON profiles(agent_verification_status) WHERE agent_verification_status IS NOT NULL;
