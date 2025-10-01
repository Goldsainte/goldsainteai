-- Remove the overly permissive public read policy on profiles
-- This policy allows anyone to read all profile data including phone numbers and preferences
DROP POLICY IF EXISTS "Public can view basic profile info" ON public.profiles;

-- Now profiles table has only:
-- 1. SELECT policy: Users can view their own profile (auth.uid() = id)
-- 2. INSERT policy: Users can insert their own profile (auth.uid() = id) 
-- 3. UPDATE policy: Users can update their own profile (auth.uid() = id)

-- This ensures that profile data (including phone, preferences, country) is only 
-- accessible by the profile owner, preventing unauthorized access to personal information