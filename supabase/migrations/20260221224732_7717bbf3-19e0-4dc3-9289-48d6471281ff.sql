
-- Allow direct bookings (not from proposals/trip requests)
ALTER TABLE public.trip_bookings 
  ALTER COLUMN proposal_id DROP NOT NULL,
  ALTER COLUMN trip_request_id DROP NOT NULL,
  ALTER COLUMN partner_payout SET DEFAULT 0,
  ALTER COLUMN platform_commission SET DEFAULT 0;
