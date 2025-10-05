-- Add INSERT policy for bookings table to allow users to create their own bookings
CREATE POLICY "Users can create their own bookings" 
ON public.bookings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add INSERT policy for payments table (currently only service role can insert)
-- Note: This requires authenticated user context
CREATE POLICY "Users can create payment records for their bookings" 
ON public.payments 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = payments.booking_id 
    AND bookings.user_id = auth.uid()
  )
);

-- Add UPDATE policy for payments to allow payment verification updates
CREATE POLICY "Users can update payments for their bookings"
ON public.payments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = payments.booking_id 
    AND bookings.user_id = auth.uid()
  )
);

-- Enhance booking modifications policy for better ownership validation
CREATE POLICY "Users can create modifications for their bookings"
ON public.booking_modifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add policy to prevent cross-user booking access
CREATE POLICY "Users can only update their own bookings"
ON public.bookings
FOR UPDATE
USING (auth.uid() = user_id);

-- Add function search_path to existing functions to fix linter warning
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.update_visa_requests_updated_at() SET search_path = public;
ALTER FUNCTION public.assign_agent_role() SET search_path = public;
ALTER FUNCTION public.update_booking_preferences_updated_at() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.expire_old_marketplace_jobs() SET search_path = public;
ALTER FUNCTION public.calculate_bid_pricing(numeric, numeric, numeric) SET search_path = public;
ALTER FUNCTION public.calculate_agent_trust_score(uuid) SET search_path = public;
ALTER FUNCTION public.update_agent_rating() SET search_path = public;
ALTER FUNCTION public.award_loyalty_points(uuid, integer, text, text, uuid) SET search_path = public;
ALTER FUNCTION public.update_agent_performance_metrics(uuid) SET search_path = public;
ALTER FUNCTION public.evaluate_agent_badges(uuid) SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;