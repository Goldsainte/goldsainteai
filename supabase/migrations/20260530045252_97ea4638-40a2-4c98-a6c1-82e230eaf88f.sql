DROP POLICY IF EXISTS "Admins can view all packaged trips" ON public.packaged_trips;

CREATE POLICY "Admins can view all packaged trips"
ON public.packaged_trips
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));