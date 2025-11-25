-- Ensure proposer columns exist in trip_proposals with correct types
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trip_proposals' AND column_name = 'proposer_id'
  ) THEN
    ALTER TABLE trip_proposals
    ADD COLUMN proposer_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trip_proposals' AND column_name = 'proposer_role'
  ) THEN
    ALTER TABLE trip_proposals
    ADD COLUMN proposer_role text CHECK (proposer_role IN ('agent', 'creator'));
  END IF;
END $$;