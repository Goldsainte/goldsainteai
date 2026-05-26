-- Extend profiles table for creators
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'traveler',
  ADD COLUMN IF NOT EXISTS tiktok_handle text,
  ADD COLUMN IF NOT EXISTS home_base text,
  ADD COLUMN IF NOT EXISTS creator_niches text[],
  ADD COLUMN IF NOT EXISTS creator_budget_levels text[],
  ADD COLUMN IF NOT EXISTS creator_pov text,
  ADD COLUMN IF NOT EXISTS has_completed_creator_onboarding boolean DEFAULT false;

-- Update existing NULL roles to 'traveler'
UPDATE public.profiles SET role = 'traveler' WHERE role IS NULL OR role NOT IN ('traveler', 'creator', 'agent', 'admin');

-- Add check constraint for role
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('traveler', 'creator', 'agent', 'admin'));

-- Extend trip_requests table for matching
ALTER TABLE public.trip_requests
  ADD COLUMN IF NOT EXISTS destination text,
  ADD COLUMN IF NOT EXISTS traveler_count integer,
  ADD COLUMN IF NOT EXISTS traveler_type text,
  ADD COLUMN IF NOT EXISTS occasion text,
  ADD COLUMN IF NOT EXISTS budget_level text,
  ADD COLUMN IF NOT EXISTS travel_styles text[],
  ADD COLUMN IF NOT EXISTS departure_city text,
  ADD COLUMN IF NOT EXISTS wants_role text,
  ADD COLUMN IF NOT EXISTS tiktok_links text[];

-- Add check constraint for wants_role
ALTER TABLE public.trip_requests 
  DROP CONSTRAINT IF EXISTS trip_requests_wants_role_check;

ALTER TABLE public.trip_requests 
  ADD CONSTRAINT trip_requests_wants_role_check 
  CHECK (wants_role IS NULL OR wants_role IN ('creator', 'agent', 'both'));

-- CREATE INDEX IF NOT EXISTS on role for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- CREATE INDEX IF NOT EXISTS on destination for matching
CREATE INDEX IF NOT EXISTS idx_trip_requests_destination ON public.trip_requests(destination);

COMMENT ON COLUMN public.profiles.role IS 'User role: traveler, creator, agent, or admin';
COMMENT ON COLUMN public.profiles.creator_niches IS 'Travel niches for creators (e.g., Beach escapes, Design hotels)';
COMMENT ON COLUMN public.profiles.creator_budget_levels IS 'Budget levels creator works with (e.g., Affordable-chic, Classic luxury)';
COMMENT ON COLUMN public.trip_requests.wants_role IS 'Whether traveler wants creator, agent, or both';
