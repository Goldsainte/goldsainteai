-- Add missing columns to travel_agents for backward compatibility
ALTER TABLE travel_agents
ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS identity_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS background_check_status TEXT,
ADD COLUMN IF NOT EXISTS professional_license_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS insurance_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS business_address TEXT,
ADD COLUMN IF NOT EXISTS destinations TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- Add missing columns to trip_proposals for backward compatibility
ALTER TABLE trip_proposals
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS nights INTEGER,
ADD COLUMN IF NOT EXISTS inclusions TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS exclusions TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE;

-- Create foreign key between agent_packages and travel_agents if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'agent_packages_agent_id_fkey' 
    AND table_name = 'agent_packages'
  ) THEN
    ALTER TABLE agent_packages
    ADD CONSTRAINT agent_packages_agent_id_fkey
    FOREIGN KEY (agent_id) REFERENCES travel_agents(user_id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add missing columns to trip_bookings for trip_requests relation
ALTER TABLE trip_bookings
ADD COLUMN IF NOT EXISTS trip_request_id UUID REFERENCES trip_requests(id);

-- Update brand_profiles to ensure owner_user_id exists (should already exist from schema)
-- This is just a safety check
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'brand_profiles' 
    AND column_name = 'owner_user_id'
  ) THEN
    ALTER TABLE brand_profiles ADD COLUMN owner_user_id UUID REFERENCES auth.users ON DELETE CASCADE;
  END IF;
END $$;