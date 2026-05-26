-- ============================================================================
-- PHASE 1: STRIPE IDENTITY VERIFICATION DATABASE FOUNDATION
-- ============================================================================
-- Creates comprehensive application system for agents & brands with 
-- Stripe Identity verification and admin approval workflow
-- ============================================================================

-- ============================================================================
-- 1. CREATE brand_applications TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS brand_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_profile_id UUID REFERENCES brand_profiles(id) ON DELETE CASCADE,
  
  -- Primary Contact
  primary_contact_name TEXT NOT NULL,
  primary_contact_email TEXT NOT NULL,
  primary_contact_phone TEXT,
  primary_contact_title TEXT,
  
  -- Brand Details
  brand_name TEXT NOT NULL,
  brand_type TEXT NOT NULL,
  website TEXT,
  regions TEXT[],
  style_tags TEXT[],
  
  -- Stripe Identity Verification
  stripe_verification_session_id TEXT UNIQUE,
  stripe_verification_status TEXT DEFAULT 'pending',
  stripe_verified_at TIMESTAMPTZ,
  
  -- Admin Review
  admin_status TEXT DEFAULT 'pending_review',
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  admin_notes TEXT,
  
  -- Account Creation Tracking
  user_account_created BOOLEAN DEFAULT false,
  created_user_id UUID REFERENCES auth.users(id),
  account_created_at TIMESTAMPTZ,
  brand_profile_created BOOLEAN DEFAULT false,
  created_brand_profile_id UUID REFERENCES brand_profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brand_applications_status ON brand_applications(admin_status);
CREATE INDEX IF NOT EXISTS idx_brand_applications_stripe_session ON brand_applications(stripe_verification_session_id);
CREATE INDEX IF NOT EXISTS idx_brand_applications_email ON brand_applications(primary_contact_email);

-- ============================================================================
-- 2. UPDATE agent_applications TABLE
-- ============================================================================
ALTER TABLE agent_applications
ADD COLUMN IF NOT EXISTS stripe_verification_session_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_verification_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS stripe_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS admin_status TEXT DEFAULT 'pending_review',
ADD COLUMN IF NOT EXISTS user_account_created BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS created_user_id UUID,
ADD COLUMN IF NOT EXISTS account_created_at TIMESTAMPTZ;

-- Add constraints separately
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'agent_applications_stripe_verification_session_id_key'
  ) THEN
    ALTER TABLE agent_applications ADD CONSTRAINT agent_applications_stripe_verification_session_id_key UNIQUE (stripe_verification_session_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'agent_applications_created_user_id_fkey'
  ) THEN
    ALTER TABLE agent_applications ADD CONSTRAINT agent_applications_created_user_id_fkey FOREIGN KEY (created_user_id) REFERENCES auth.users(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_agent_applications_stripe_session 
ON agent_applications(stripe_verification_session_id);

CREATE INDEX IF NOT EXISTS idx_agent_applications_admin_status 
ON agent_applications(admin_status);

-- ============================================================================
-- 3. CREATE admin_users TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  
  -- Permissions
  can_approve_agents BOOLEAN DEFAULT false,
  can_approve_brands BOOLEAN DEFAULT false,
  can_manage_disputes BOOLEAN DEFAULT false,
  can_view_analytics BOOLEAN DEFAULT false,
  is_super_admin BOOLEAN DEFAULT false,
  
  -- Metadata
  admin_role TEXT,
  department TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_agent_approval ON admin_users(can_approve_agents) 
WHERE can_approve_agents = true;
CREATE INDEX IF NOT EXISTS idx_admin_users_brand_approval ON admin_users(can_approve_brands) 
WHERE can_approve_brands = true;

-- ============================================================================
-- 4. UPDATE profiles TABLE
-- ============================================================================
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS brand_verification_status TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_agent_verification 
ON profiles(agent_verification_status) WHERE agent_verification_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_brand_verification 
ON profiles(brand_verification_status) WHERE brand_verification_status IS NOT NULL;

-- ============================================================================
-- 5. ENABLE RLS POLICIES
-- ============================================================================

-- Brand Applications RLS
ALTER TABLE brand_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own brand applications"
ON brand_applications FOR SELECT
USING (auth.uid() IN (
  SELECT owner_user_id FROM brand_profiles WHERE id = brand_profile_id
));

CREATE POLICY "Users can create brand applications"
ON brand_applications FOR INSERT
WITH CHECK (auth.uid() IN (
  SELECT owner_user_id FROM brand_profiles WHERE id = brand_profile_id
));

-- Admin Users RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all admin users"
ON admin_users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND is_super_admin = true
  )
);
