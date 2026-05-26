-- Add user_id to bookings to support authenticated user bookings
ALTER TABLE public.bookings 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add index for faster user booking queries
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);

-- Update bookings RLS policies to allow users to view their own bookings
DROP POLICY IF EXISTS "bookings_service_role_access" ON public.bookings;

-- Service role can do everything (for booking creation via edge functions)
CREATE POLICY "bookings_service_role_full_access" ON public.bookings
FOR ALL 
USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Users can view their own bookings
CREATE POLICY "bookings_user_view_own" ON public.bookings
FOR SELECT
USING (auth.uid() = user_id);

-- Update guests RLS to allow users to view guests linked to their bookings
DROP POLICY IF EXISTS "guests_service_role_access" ON public.guests;

-- Service role can do everything
CREATE POLICY "guests_service_role_full_access" ON public.guests
FOR ALL
USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Users can view guest records linked to their bookings
CREATE POLICY "guests_user_view_through_bookings" ON public.guests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bookings
    WHERE bookings.guest_id = guests.id
    AND bookings.user_id = auth.uid()
  )
);

-- Update payments RLS to allow users to view their own payments
DROP POLICY IF EXISTS "payments_service_role_access" ON public.payments;

-- Service role can do everything
CREATE POLICY "payments_service_role_full_access" ON public.payments
FOR ALL
USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Users can view payments for their own bookings
CREATE POLICY "payments_user_view_own" ON public.payments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bookings
    WHERE bookings.id = payments.booking_id
    AND bookings.user_id = auth.uid()
  )
);

-- Enhance profiles table with additional fields
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{}'::jsonb;

-- Create a search_history table for storing user searches
CREATE TABLE IF NOT EXISTS public.search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  search_type text NOT NULL CHECK (search_type IN ('hotel', 'flight', 'car', 'restaurant', 'event', 'destination')),
  search_params jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on search_history
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own search history
CREATE POLICY "search_history_user_view_own" ON public.search_history
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own search history
CREATE POLICY "search_history_user_insert_own" ON public.search_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own search history
CREATE POLICY "search_history_user_delete_own" ON public.search_history
FOR DELETE
USING (auth.uid() = user_id);

-- Add index for faster search history queries
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON public.search_history(user_id, created_at DESC);
