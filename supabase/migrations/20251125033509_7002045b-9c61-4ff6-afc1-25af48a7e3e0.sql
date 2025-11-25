-- Add missing share columns to bookings
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS agent_share DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS creator_share DECIMAL(10,2);

-- Add payment_schedule to trip_proposals
ALTER TABLE trip_proposals
ADD COLUMN IF NOT EXISTS payment_schedule JSONB DEFAULT '[]'::jsonb;

-- Add FK from bookings to trips
ALTER TABLE bookings
DROP CONSTRAINT IF EXISTS bookings_trip_id_fkey,
ADD CONSTRAINT bookings_trip_id_fkey
FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL;