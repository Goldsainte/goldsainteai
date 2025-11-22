-- Add foreign key constraint from trip_requests.user_id to profiles.id
-- This enables PostgREST join syntax: profiles:user_id (...)
ALTER TABLE public.trip_requests
  DROP CONSTRAINT IF EXISTS trip_requests_user_id_profiles_fkey;

ALTER TABLE public.trip_requests
  ADD CONSTRAINT trip_requests_user_id_profiles_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.profiles(id)
  ON DELETE SET NULL;

-- Add index for better query performance on trip_requests.user_id
CREATE INDEX IF NOT EXISTS idx_trip_requests_user_id_profiles
  ON public.trip_requests(user_id);