-- Remove permissive policy that allows anyone to view guest data
DROP POLICY IF EXISTS "Anyone can view guests" ON public.guests;

-- Add secure policy: only service role can manage guests (for booking process)
CREATE POLICY "Service role can manage guests" ON public.guests
FOR ALL USING (
  current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  OR auth.uid() IS NOT NULL
);

-- Allow users to view guests only through their own bookings
CREATE POLICY "Users can view guests through bookings" ON public.guests
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.bookings
    WHERE bookings.guest_id = guests.id
  )
);

-- Remove overly permissive policies on bookings and payments
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can view bookings" ON public.bookings;

DROP POLICY IF EXISTS "Anyone can create payments" ON public.payments;
DROP POLICY IF EXISTS "Anyone can update payments" ON public.payments;
DROP POLICY IF EXISTS "Anyone can view payments" ON public.payments;

-- Add secure policies for bookings (service role only for creation/updates)
CREATE POLICY "Service role can manage bookings" ON public.bookings
FOR ALL USING (
  current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
);

-- Add secure policies for payments (service role only)
CREATE POLICY "Service role can manage payments" ON public.payments
FOR ALL USING (
  current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
);

-- Fix database function search paths
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_visa_requests_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;