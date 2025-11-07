-- Add RLS policies to improve PII protection for guests table
-- Users should be able to update and delete guest records linked to their bookings

-- Policy: Users can update guests linked to their bookings
CREATE POLICY "Users can update their booking guests"
  ON public.guests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.guest_id = guests.id
        AND bookings.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.guest_id = guests.id
        AND bookings.user_id = auth.uid()
    )
  );

-- Policy: Users can delete guests linked to their bookings
CREATE POLICY "Users can delete their booking guests"
  ON public.guests
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.guest_id = guests.id
        AND bookings.user_id = auth.uid()
    )
  );

-- Add missing UPDATE policy for agent_inquiries
-- Users should be able to update their own inquiries
CREATE POLICY "Users can update their own inquiries"
  ON public.agent_inquiries
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add DELETE policy for agent_inquiries
-- Users should be able to delete their own inquiries
CREATE POLICY "Users can delete their own inquiries"
  ON public.agent_inquiries
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add UPDATE policy for itinerary_shares
-- Users should be able to update shares they created
CREATE POLICY "Users can update shares of their itineraries"
  ON public.itinerary_shares
  FOR UPDATE
  USING (
    itinerary_id IN (
      SELECT id FROM public.trip_itineraries
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    itinerary_id IN (
      SELECT id FROM public.trip_itineraries
      WHERE user_id = auth.uid()
    )
  );