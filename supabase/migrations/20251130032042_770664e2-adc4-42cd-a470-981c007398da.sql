-- Add missing columns to packaged_trips for TrovaTrip-style features
ALTER TABLE packaged_trips ADD COLUMN IF NOT EXISTS deposit_percentage INTEGER DEFAULT 30;
ALTER TABLE packaged_trips ADD COLUMN IF NOT EXISTS current_bookings INTEGER DEFAULT 0;
ALTER TABLE packaged_trips ADD COLUMN IF NOT EXISTS faqs JSONB DEFAULT '[]';
ALTER TABLE packaged_trips ADD COLUMN IF NOT EXISTS host_tagline TEXT;

-- CREATE INDEX IF NOT EXISTS for published trips lookup
CREATE INDEX IF NOT EXISTS idx_packaged_trips_status ON packaged_trips(status) WHERE status = 'published';
