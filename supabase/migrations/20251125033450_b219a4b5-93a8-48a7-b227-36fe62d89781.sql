-- Add missing trip_id column to bookings
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS trip_id UUID;

-- Add trip_request_id FK to trip_bookings
ALTER TABLE trip_bookings
DROP CONSTRAINT IF EXISTS trip_bookings_trip_request_id_fkey,
ADD CONSTRAINT trip_bookings_trip_request_id_fkey
FOREIGN KEY (trip_request_id) REFERENCES trip_requests(id) ON DELETE SET NULL;

-- Create FK from trip_proposals.cancellation_policy_id to cancellation_policies
ALTER TABLE trip_proposals
DROP CONSTRAINT IF EXISTS trip_proposals_cancellation_policy_id_fkey;

-- Recreate cancellation_policies table properly
DROP TABLE IF EXISTS cancellation_policies CASCADE;

CREATE TABLE IF NOT EXISTS cancellation_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  policy_name TEXT NOT NULL,
  description TEXT,
  refund_percentage DECIMAL(5,2) NOT NULL,
  hours_before_checkin INTEGER NOT NULL,
  booking_type TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Re-add FK
ALTER TABLE trip_proposals
ADD CONSTRAINT trip_proposals_cancellation_policy_id_fkey
FOREIGN KEY (cancellation_policy_id) REFERENCES cancellation_policies(id) ON DELETE SET NULL;