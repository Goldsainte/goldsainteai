-- Add remaining missing columns to trip_requests
ALTER TABLE trip_requests
ADD COLUMN IF NOT EXISTS occasion TEXT,
ADD COLUMN IF NOT EXISTS flexibility TEXT,
ADD COLUMN IF NOT EXISTS wants_role TEXT;