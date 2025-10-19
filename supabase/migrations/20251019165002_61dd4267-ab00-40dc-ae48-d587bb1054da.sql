-- Priority 1: Agent Terms Acceptance
ALTER TABLE travel_agents
ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS terms_version TEXT DEFAULT 'v1.0';

CREATE TABLE IF NOT EXISTS agent_terms_acceptance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES travel_agents(id) NOT NULL,
  terms_version TEXT NOT NULL,
  privacy_version TEXT NOT NULL,
  vendor_version TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  accepted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agent_id, terms_version)
);

ALTER TABLE agent_terms_acceptance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents view own acceptance"
  ON agent_terms_acceptance FOR SELECT
  USING (agent_id IN (SELECT id FROM travel_agents WHERE user_id = auth.uid()));

CREATE POLICY "Agents create own acceptance"
  ON agent_terms_acceptance FOR INSERT
  WITH CHECK (agent_id IN (SELECT id FROM travel_agents WHERE user_id = auth.uid()));

-- Priority 2: Multiple Emails for Booking Requests
ALTER TABLE marketplace_jobs
ADD COLUMN IF NOT EXISTS additional_emails JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS notify_all_emails BOOLEAN DEFAULT true;

COMMENT ON COLUMN marketplace_jobs.additional_emails IS 'Array of email objects: [{"email": "test@example.com", "name": "John Doe", "role": "co-traveler"}]';

ALTER TABLE cocurated_trip_requests
ADD COLUMN IF NOT EXISTS requester_email TEXT,
ADD COLUMN IF NOT EXISTS additional_emails JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS notify_all_emails BOOLEAN DEFAULT true;

ALTER TABLE agent_inquiries
ADD COLUMN IF NOT EXISTS additional_emails JSONB DEFAULT '[]'::jsonb;

-- Priority 4: Edit Trip Details
CREATE TABLE IF NOT EXISTS trip_request_modifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_request_id UUID REFERENCES cocurated_trip_requests(id) ON DELETE CASCADE,
  modified_by UUID REFERENCES auth.users(id),
  previous_data JSONB NOT NULL,
  new_data JSONB NOT NULL,
  modification_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE trip_request_modifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own modifications"
  ON trip_request_modifications FOR SELECT
  USING (trip_request_id IN (
    SELECT id FROM cocurated_trip_requests WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users create own modifications"
  ON trip_request_modifications FOR INSERT
  WITH CHECK (modified_by = auth.uid());

-- Priority 5: Itinerary Storage
ALTER TABLE agent_inquiries
ADD COLUMN IF NOT EXISTS generated_itinerary JSONB DEFAULT NULL;

ALTER TABLE cocurated_trip_requests
ADD COLUMN IF NOT EXISTS generated_itinerary JSONB DEFAULT NULL;