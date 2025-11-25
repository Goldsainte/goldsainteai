-- Add missing columns to trip_requests
ALTER TABLE trip_requests
ADD COLUMN IF NOT EXISTS travel_styles TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS accommodation_style TEXT,
ADD COLUMN IF NOT EXISTS pace TEXT,
ADD COLUMN IF NOT EXISTS special_notes TEXT;

-- Add missing columns to bookings
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payout_expected_at TIMESTAMPTZ;

-- Add partner_role to trip_bookings if it doesn't exist
ALTER TABLE trip_bookings
ADD COLUMN IF NOT EXISTS partner_role TEXT;