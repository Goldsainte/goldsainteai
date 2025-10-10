-- Allow authenticated users to view all profiles (needed for social features)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Anyone can view profiles"
ON public.profiles
FOR SELECT
TO public
USING (true);

-- Keep existing policies for insert/update (users can only modify their own)
-- The existing "Users can insert their own profile" and "Users can update their own profile" remain unchanged