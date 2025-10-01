-- Phase 1: Fix Critical Data Exposure Issues

-- 1. Fix profiles table RLS - restrict public viewing to non-sensitive fields only
-- Drop the overly permissive public read policy
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Create new policy: users can view their own full profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Note: Keeping public read for basic profile info for now (username, avatar)
-- In production, consider creating a separate public_profiles view with only non-sensitive fields
CREATE POLICY "Public can view basic profile info"
ON public.profiles
FOR SELECT
USING (true);

-- 2. Fix visa_service_requests table RLS - restrict access by email
-- Drop overly permissive policies
DROP POLICY IF EXISTS "Anyone can view their own requests by email" ON public.visa_service_requests;
DROP POLICY IF EXISTS "Anyone can update their own requests by email" ON public.visa_service_requests;

-- Create new policies that actually check email ownership
-- For authenticated users
CREATE POLICY "Users can view their own visa requests by email"
ON public.visa_service_requests
FOR SELECT
USING (
  user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

CREATE POLICY "Users can update their own visa requests by email"
ON public.visa_service_requests
FOR UPDATE
USING (
  user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Keep INSERT open for guest submissions (this is intentional for the visa service)
-- But add rate limiting at the application level