-- Add missing columns to bookings
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payout_paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS proposal_id UUID;

-- Add missing policy-related columns to trip_proposals  
ALTER TABLE trip_proposals
ADD COLUMN IF NOT EXISTS custom_cancellation_terms TEXT,
ADD COLUMN IF NOT EXISTS deposit_percentage DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS deposit_due_days INTEGER,
ADD COLUMN IF NOT EXISTS cancellation_policy_id UUID,
ADD COLUMN IF NOT EXISTS trip_request_id UUID;