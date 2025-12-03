-- =====================================================
-- FIX: admin_users infinite recursion - COMPLETE
-- =====================================================

-- Step 1: Create SECURITY DEFINER functions
CREATE OR REPLACE FUNCTION public.is_super_admin(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = p_user_id AND is_super_admin = true
  )
$$;

CREATE OR REPLACE FUNCTION public.can_approve_agents(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = p_user_id 
    AND (can_approve_agents = true OR is_super_admin = true)
  )
$$;

CREATE OR REPLACE FUNCTION public.can_approve_brands(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = p_user_id 
    AND (can_approve_brands = true OR is_super_admin = true)
  )
$$;

-- Step 2: Fix admin_users policy
DROP POLICY IF EXISTS "Admins can view all admin users" ON admin_users;
CREATE POLICY "Admins can view all admin users" ON admin_users
FOR SELECT USING (user_id = auth.uid() OR public.is_super_admin());

-- Step 3: Fix agent_applications policies
DROP POLICY IF EXISTS "Admins can update agent applications" ON agent_applications;
DROP POLICY IF EXISTS "Admins can delete agent applications" ON agent_applications;

CREATE POLICY "Admins can update agent applications" ON agent_applications
FOR UPDATE USING (public.can_approve_agents());

CREATE POLICY "Admins can delete agent applications" ON agent_applications
FOR DELETE USING (public.can_approve_agents());

-- Step 4: Fix brand_applications policies
DROP POLICY IF EXISTS "Admins can update brand applications" ON brand_applications;
DROP POLICY IF EXISTS "Admins can delete brand applications" ON brand_applications;

CREATE POLICY "Admins can update brand applications" ON brand_applications
FOR UPDATE USING (public.can_approve_brands());

CREATE POLICY "Admins can delete brand applications" ON brand_applications
FOR DELETE USING (public.can_approve_brands());