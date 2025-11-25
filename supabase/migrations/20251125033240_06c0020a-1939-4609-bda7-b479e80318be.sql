-- Add more missing columns to travel_agents
ALTER TABLE travel_agents
ADD COLUMN IF NOT EXISTS regions TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS specializations TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS service_types TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS primary_contact_name TEXT,
ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS min_budget DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS max_budget DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS experience_years INTEGER;

-- Add agent_id column to agent_verification_requests if missing
ALTER TABLE agent_verification_requests
ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES travel_agents(user_id);

-- Create relation between trip_request_matches and trip_requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'trip_request_matches_trip_request_id_fkey'
  ) THEN
    ALTER TABLE trip_request_matches
    ADD CONSTRAINT trip_request_matches_trip_request_id_fkey
    FOREIGN KEY (trip_request_id) REFERENCES trip_requests(id) ON DELETE CASCADE;
  END IF;
END $$;