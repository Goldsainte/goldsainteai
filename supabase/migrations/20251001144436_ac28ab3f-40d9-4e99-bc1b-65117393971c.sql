-- Drop all existing policies on guests table
DROP POLICY IF EXISTS "Anyone can view guests" ON public.guests;
DROP POLICY IF EXISTS "Anyone can create guest records" ON public.guests;
DROP POLICY IF EXISTS "Service role can manage guests" ON public.guests;
DROP POLICY IF EXISTS "Users can view guests through bookings" ON public.guests;

-- Create new secure policy for guests (only service role)
CREATE POLICY "guests_service_role_access" ON public.guests
FOR ALL USING (
  current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
);

-- Drop all existing policies on bookings table
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can view bookings" ON public.bookings;
DROP POLICY IF EXISTS "Service role can manage bookings" ON public.bookings;

-- Create new secure policy for bookings (only service role)
CREATE POLICY "bookings_service_role_access" ON public.bookings
FOR ALL USING (
  current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
);

-- Drop all existing policies on payments table
DROP POLICY IF EXISTS "Anyone can create payments" ON public.payments;
DROP POLICY IF EXISTS "Anyone can update payments" ON public.payments;
DROP POLICY IF EXISTS "Anyone can view payments" ON public.payments;
DROP POLICY IF EXISTS "Service role can manage payments" ON public.payments;

-- Create new secure policy for payments (only service role)
CREATE POLICY "payments_service_role_access" ON public.payments
FOR ALL USING (
  current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
);

-- Update all database functions to include proper search_path
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