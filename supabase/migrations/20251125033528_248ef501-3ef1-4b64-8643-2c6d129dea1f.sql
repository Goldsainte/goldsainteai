-- Add valid_until to trip_proposals (was renamed from expires_at)
ALTER TABLE trip_proposals
ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ;

-- Add budget_level to trip_requests
ALTER TABLE trip_requests
ADD COLUMN IF NOT EXISTS budget_level TEXT;