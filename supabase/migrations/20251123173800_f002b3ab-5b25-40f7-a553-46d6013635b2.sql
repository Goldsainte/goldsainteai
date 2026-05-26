-- Create trip_contracts table
CREATE TABLE IF NOT EXISTS trip_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES profiles(id),
  traveler_id UUID NOT NULL REFERENCES profiles(id),
  creator_id UUID REFERENCES profiles(id),
  
  -- Contract data
  contract_sections JSONB NOT NULL DEFAULT '[]',
  traveler_info JSONB NOT NULL DEFAULT '{}',
  trip_info JSONB NOT NULL DEFAULT '{}',
  field_values JSONB NOT NULL DEFAULT '{}',
  
  -- Signatures
  agent_signature TEXT,
  traveler_signature TEXT,
  creator_signature TEXT,
  
  -- Signature timestamps
  agent_signed_at TIMESTAMPTZ,
  traveler_signed_at TIMESTAMPTZ,
  creator_signed_at TIMESTAMPTZ,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_signatures', 'fully_executed', 'expired', 'terminated')),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one contract per trip
  CONSTRAINT unique_trip_contract UNIQUE (trip_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_trip_contracts_trip_id ON trip_contracts(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_contracts_agent_id ON trip_contracts(agent_id);
CREATE INDEX IF NOT EXISTS idx_trip_contracts_traveler_id ON trip_contracts(traveler_id);
CREATE INDEX IF NOT EXISTS idx_trip_contracts_status ON trip_contracts(status);
CREATE INDEX IF NOT EXISTS idx_trip_contracts_created_at ON trip_contracts(created_at);

-- Enable RLS
ALTER TABLE trip_contracts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Agents can view/edit contracts for their trips
CREATE POLICY "Agents can manage their trip contracts"
  ON trip_contracts
  FOR ALL
  TO authenticated
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

-- Travelers can view contracts for their trips
CREATE POLICY "Travelers can view their contracts"
  ON trip_contracts
  FOR SELECT
  TO authenticated
  USING (traveler_id = auth.uid());

-- Travelers can sign their contracts
CREATE POLICY "Travelers can sign their contracts"
  ON trip_contracts
  FOR UPDATE
  TO authenticated
  USING (traveler_id = auth.uid())
  WITH CHECK (traveler_id = auth.uid());

-- Creators can view contracts where they're involved
CREATE POLICY "Creators can view their contracts"
  ON trip_contracts
  FOR SELECT
  TO authenticated
  USING (creator_id = auth.uid());

-- Creators can sign their contracts
CREATE POLICY "Creators can sign their contracts"
  ON trip_contracts
  FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_trip_contracts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = 'public';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_trip_contracts_updated_at
  BEFORE UPDATE ON trip_contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_trip_contracts_updated_at();
