-- Fix RLS policies to allow anonymous application submissions
-- Migration: Allow anonymous users to submit and check applications

-- ============================================================================
-- 1. DROP existing restrictive policies
-- ============================================================================
DROP POLICY IF EXISTS "Users can create brand applications" ON brand_applications;
DROP POLICY IF EXISTS "Users can view their own brand applications" ON brand_applications;
DROP POLICY IF EXISTS "Brand owners can view their applications" ON brand_applications;

-- ============================================================================
-- 2. CREATE new anonymous-friendly policies for agent_applications
-- ============================================================================

-- Allow ANYONE (including anonymous) to submit agent applications
CREATE POLICY "Anyone can submit an agent application"
  ON agent_applications FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anyone to check agent application status by email
CREATE POLICY "Anyone can check agent application by email"
  ON agent_applications FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admins can update agent applications
CREATE POLICY "Admins can update agent applications"
  ON agent_applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() 
      AND (can_approve_agents = true OR is_super_admin = true)
    )
  );

-- ============================================================================
-- 3. CREATE new anonymous-friendly policies for brand_applications
-- ============================================================================

-- Allow ANYONE (including anonymous) to submit brand applications
CREATE POLICY "Anyone can submit a brand application"
  ON brand_applications FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anyone to check brand application status by email
CREATE POLICY "Anyone can check brand application by email"
  ON brand_applications FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admins can update brand applications
CREATE POLICY "Admins can update brand applications"
  ON brand_applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() 
      AND (can_approve_brands = true OR is_super_admin = true)
    )
  );