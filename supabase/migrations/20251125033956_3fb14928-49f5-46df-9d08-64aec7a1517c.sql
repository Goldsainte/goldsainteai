-- Add proposer_id and proposer_role columns to trip_proposals
ALTER TABLE trip_proposals
ADD COLUMN IF NOT EXISTS proposer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS proposer_role text CHECK (proposer_role IN ('agent', 'creator'));