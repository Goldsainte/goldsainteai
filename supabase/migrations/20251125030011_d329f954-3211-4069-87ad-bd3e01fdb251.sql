-- ============================================================================
-- COMPLETE APPLICATION SCHEMA REWRITE
-- Drops and recreates agent_applications, brand_applications with new status
-- flow, adds audit logging, and enhances webhook_events
-- ============================================================================

-- ============================================================================
-- AGENT APPLICATIONS TABLE (Complete Rewrite)
-- ============================================================================

DROP TABLE IF EXISTS agent_applications CASCADE;

CREATE TABLE IF NOT EXISTS agent_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Application Status (NO user_id yet - anonymous!)
  status TEXT DEFAULT 'pending_verification' CHECK (status IN (
    'pending_verification',  -- Submitted, waiting for Stripe Identity
    'verified',             -- Identity verified, waiting for admin
    'pending_review',       -- Admin is reviewing
    'approved',             -- Admin approved, auth account created
    'rejected',             -- Admin rejected
    'failed'                -- Identity verification failed
  )),
  
  -- Personal Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  
  -- Business Information
  agency_name TEXT NOT NULL,
  business_type TEXT NOT NULL CHECK (business_type IN (
    'independent', 'agency', 'tour_operator', 'dmc'
  )),
  business_registration_number TEXT,
  business_address TEXT NOT NULL,
  website TEXT,
  
  -- Licensing
  license_number TEXT,
  accreditations TEXT,
  years_experience INTEGER NOT NULL,
  
  -- Services
  service_types TEXT[] DEFAULT '{}',
  destinations TEXT[] DEFAULT '{}',
  specialties TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  
  -- Financial
  preferred_currency TEXT DEFAULT 'USD',
  payment_processor TEXT,
  tax_id TEXT,
  
  -- Stripe Identity
  stripe_verification_session_id TEXT UNIQUE,
  stripe_verification_status TEXT,
  stripe_verified_at TIMESTAMPTZ,
  stripe_verification_report JSONB,
  
  -- Admin Review
  admin_reviewer_id UUID REFERENCES auth.users,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  admin_notes TEXT,
  
  -- Legal Compliance
  accepted_terms BOOLEAN DEFAULT false,
  accepted_privacy BOOLEAN DEFAULT false,
  accepted_vendor BOOLEAN DEFAULT false,
  accepted_gdpr BOOLEAN DEFAULT false,
  
  -- Communication Preferences
  email_notifications_enabled BOOLEAN DEFAULT true,
  sms_notifications_enabled BOOLEAN DEFAULT false,
  whatsapp_notifications_enabled BOOLEAN DEFAULT false,
  
  -- Timestamps
  submitted_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Auth Account Link (populated AFTER approval)
  user_id UUID REFERENCES auth.users,
  
  -- Constraints
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_phone CHECK (phone ~ '^\+?[1-9]\d{1,14}$')
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_applications_status ON agent_applications(status);
CREATE INDEX IF NOT EXISTS idx_agent_applications_email ON agent_applications(email);
CREATE INDEX IF NOT EXISTS idx_agent_applications_stripe_session ON agent_applications(stripe_verification_session_id);
CREATE INDEX IF NOT EXISTS idx_agent_applications_submitted_at ON agent_applications(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_applications_user_id ON agent_applications(user_id);

-- RLS Policies
ALTER TABLE agent_applications ENABLE ROW LEVEL SECURITY;

-- Anonymous users can INSERT (submit application)
CREATE POLICY "Anyone can submit agent application"
  ON agent_applications FOR INSERT
  WITH CHECK (true);

-- Applicants can view their own application by email (before auth account exists)
CREATE POLICY "Applicants can view own application by email"
  ON agent_applications FOR SELECT
  USING (
    email = current_setting('request.jwt.claims', true)::json->>'email'
    OR user_id = auth.uid()
  );

-- Admins can view all applications
CREATE POLICY "Admins can view all applications"
  ON agent_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND account_type = 'admin'
    )
  );

-- Admins can update applications (for approval/rejection)
CREATE POLICY "Admins can update applications"
  ON agent_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND account_type = 'admin'
    )
  );

-- Service role can update for webhooks and edge functions
CREATE POLICY "Service role can update applications"
  ON agent_applications FOR UPDATE
  USING (auth.role() = 'service_role');

-- ============================================================================
-- BRAND APPLICATIONS TABLE (Same Structure)
-- ============================================================================

DROP TABLE IF EXISTS brand_applications CASCADE;

CREATE TABLE IF NOT EXISTS brand_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Application Status
  status TEXT DEFAULT 'pending_verification' CHECK (status IN (
    'pending_verification',
    'verified',
    'pending_review',
    'approved',
    'rejected',
    'failed'
  )),
  
  -- Contact Information
  primary_contact_name TEXT NOT NULL,
  primary_contact_email TEXT NOT NULL UNIQUE,
  primary_contact_phone TEXT NOT NULL,
  
  -- Brand Information
  brand_name TEXT NOT NULL,
  brand_type TEXT NOT NULL CHECK (brand_type IN (
    'Hotel', 'Resort', 'Villa / Home', 'Boutique Stay',
    'Restaurant / Bar', 'Experience Brand', 'Retail / Design Brand'
  )),
  website TEXT,
  tagline TEXT,
  bio TEXT,
  regions TEXT[] DEFAULT '{}',
  style_tags TEXT[] DEFAULT '{}',
  
  -- Stripe Identity
  stripe_verification_session_id TEXT UNIQUE,
  stripe_verification_status TEXT,
  stripe_verified_at TIMESTAMPTZ,
  stripe_verification_report JSONB,
  
  -- Admin Review
  admin_reviewer_id UUID REFERENCES auth.users,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  admin_notes TEXT,
  
  -- Timestamps
  submitted_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Auth Account Link (populated AFTER approval)
  user_id UUID REFERENCES auth.users,
  brand_profile_id UUID REFERENCES brand_profiles,
  
  CONSTRAINT valid_contact_email CHECK (primary_contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_brand_applications_status ON brand_applications(status);
CREATE INDEX IF NOT EXISTS idx_brand_applications_email ON brand_applications(primary_contact_email);
CREATE INDEX IF NOT EXISTS idx_brand_applications_stripe_session ON brand_applications(stripe_verification_session_id);
CREATE INDEX IF NOT EXISTS idx_brand_applications_submitted_at ON brand_applications(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_brand_applications_user_id ON brand_applications(user_id);

-- RLS Policies
ALTER TABLE brand_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit brand application"
  ON brand_applications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Applicants can view own brand application by email"
  ON brand_applications FOR SELECT
  USING (
    primary_contact_email = current_setting('request.jwt.claims', true)::json->>'email'
    OR user_id = auth.uid()
  );

CREATE POLICY "Admins can view all brand applications"
  ON brand_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND account_type = 'admin'
    )
  );

CREATE POLICY "Admins can update brand applications"
  ON brand_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND account_type = 'admin'
    )
  );

CREATE POLICY "Service role can update brand applications"
  ON brand_applications FOR UPDATE
  USING (auth.role() = 'service_role');

-- ============================================================================
-- WEBHOOK EVENTS TABLE (Enhance existing)
-- ============================================================================

-- Add missing columns to existing webhook_events table
ALTER TABLE webhook_events
  ADD COLUMN IF NOT EXISTS event_source TEXT DEFAULT 'stripe' 
    CHECK (event_source IN ('stripe', 'stripe_identity', 'other')),
  ADD COLUMN IF NOT EXISTS processing_duration_ms INTEGER,
  ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type 
  ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_source 
  ON webhook_events(event_source);

-- ============================================================================
-- APPLICATION AUDIT LOG (New Table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS application_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL,
  application_type TEXT NOT NULL CHECK (application_type IN ('agent', 'brand')),
  action TEXT NOT NULL CHECK (action IN (
    'submitted', 'identity_verified', 'identity_failed',
    'admin_reviewed', 'approved', 'rejected',
    'account_created', 'notification_sent'
  )),
  actor_id UUID REFERENCES auth.users,
  actor_type TEXT CHECK (actor_type IN ('system', 'admin', 'webhook', 'applicant')),
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_application ON application_audit_log(application_id, application_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON application_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON application_audit_log(action);

ALTER TABLE application_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
  ON application_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND account_type = 'admin'
    )
  );

CREATE POLICY "Service role can insert audit logs"
  ON application_audit_log FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE agent_applications IS 'Agent applications submitted anonymously before account creation';
COMMENT ON TABLE brand_applications IS 'Brand applications submitted anonymously before account creation';
COMMENT ON TABLE application_audit_log IS 'Audit trail for all application state changes';
COMMENT ON COLUMN agent_applications.status IS 'Primary status field: pending_verification -> verified -> approved/rejected';
COMMENT ON COLUMN agent_applications.user_id IS 'Populated AFTER admin approval when auth account is created';
COMMENT ON COLUMN brand_applications.brand_profile_id IS 'Populated AFTER admin approval when brand_profile is created';
