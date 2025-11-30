-- Fix profiles privileges for authenticated users while keeping RLS strict

-- Ensure RLS is enabled (safe if it's already on)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Make sure RLS policies for insert/update exist and are correct
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow authenticated users to insert and update their own profiles.
GRANT INSERT, UPDATE ON TABLE public.profiles TO authenticated;

-- Make sure anonymous users cannot modify profiles
REVOKE INSERT, UPDATE, DELETE ON TABLE public.profiles FROM anon;