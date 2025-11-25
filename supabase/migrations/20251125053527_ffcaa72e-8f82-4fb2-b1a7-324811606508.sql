-- Fix RLS policy to allow profile creation during agent account approval
-- The handle_new_user() trigger runs with SECURITY DEFINER and needs permission to insert profiles

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Create a new policy that allows both user self-insert and service role inserts
CREATE POLICY "Allow profile creation"
ON profiles
FOR INSERT
TO public
WITH CHECK (
  auth.uid() = id  -- Authenticated users can insert their own profile
  OR 
  auth.role() = 'service_role'  -- Service role can insert any profile (for triggers and admin operations)
);