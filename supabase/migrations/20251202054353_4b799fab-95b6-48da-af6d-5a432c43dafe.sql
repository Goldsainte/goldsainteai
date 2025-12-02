-- Drop existing admin policies on brand_applications that use profiles.account_type
DROP POLICY IF EXISTS "Admins can view all brand applications" ON brand_applications;
DROP POLICY IF EXISTS "Admins can update brand applications" ON brand_applications;

-- Drop existing admin policies on agent_applications that use profiles.account_type
DROP POLICY IF EXISTS "Admins can view all agent applications" ON agent_applications;
DROP POLICY IF EXISTS "Admins can update agent applications" ON agent_applications;

-- Create new admin SELECT policy for brand_applications using user_roles
CREATE POLICY "Admins can view all brand applications"
ON brand_applications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Create new admin UPDATE policy for brand_applications using user_roles
CREATE POLICY "Admins can update brand applications"
ON brand_applications
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Create new admin SELECT policy for agent_applications using user_roles
CREATE POLICY "Admins can view all agent applications"
ON agent_applications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Create new admin UPDATE policy for agent_applications using user_roles
CREATE POLICY "Admins can update agent applications"
ON agent_applications
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);