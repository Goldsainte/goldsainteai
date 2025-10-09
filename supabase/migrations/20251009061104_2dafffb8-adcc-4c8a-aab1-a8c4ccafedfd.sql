-- Fix RLS policy for travel_posts to show all posts (not just active)
DROP POLICY IF EXISTS "Anyone can view active posts" ON public.travel_posts;

CREATE POLICY "Anyone can view all posts"
  ON public.travel_posts FOR SELECT
  USING (true);

-- Add full_name column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT;