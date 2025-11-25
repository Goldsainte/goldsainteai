-- Add missing columns to trip_requests
ALTER TABLE trip_requests
ADD COLUMN IF NOT EXISTS source_brand_profile_id UUID REFERENCES brand_profiles(id),
ADD COLUMN IF NOT EXISTS source_collection_id UUID,
ADD COLUMN IF NOT EXISTS source_metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS departure_city TEXT;

-- Add email column to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add missing columns to bookings
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS creator_earnings DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS agent_earnings DECIMAL(10,2);