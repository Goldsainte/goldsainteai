-- Optimize key lookup paths for trip marketplace flows
CREATE INDEX IF NOT EXISTS idx_trip_requests_user
  ON public.trip_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_trip_bookings_traveler
  ON public.trip_bookings(traveler_id);

CREATE INDEX IF NOT EXISTS idx_trip_bookings_partner
  ON public.trip_bookings(partner_id);

CREATE INDEX IF NOT EXISTS idx_trip_bookings_trip_request
  ON public.trip_bookings(trip_request_id);

CREATE INDEX IF NOT EXISTS idx_trip_request_messages_sender
  ON public.trip_request_messages(sender_id);
