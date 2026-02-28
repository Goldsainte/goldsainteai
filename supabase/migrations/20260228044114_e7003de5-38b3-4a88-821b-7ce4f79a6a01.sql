
-- 1. Admin DELETE policy on trip_requests
CREATE POLICY "Admins can delete any trip request"
ON public.trip_requests
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2. Fix FK on messages to CASCADE on delete
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_trip_request_id_fkey;
ALTER TABLE public.messages ADD CONSTRAINT messages_trip_request_id_fkey
  FOREIGN KEY (trip_request_id) REFERENCES public.trip_requests(id) ON DELETE CASCADE;

-- 3. Fix FK on bookings to SET NULL on delete
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_trip_request_id_fkey;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_trip_request_id_fkey
  FOREIGN KEY (trip_request_id) REFERENCES public.trip_requests(id) ON DELETE SET NULL;
