-- Add initiated_by field to track who started the promotion request
ALTER TABLE influencer_promotions 
ADD COLUMN IF NOT EXISTS initiated_by TEXT NOT NULL DEFAULT 'influencer' CHECK (initiated_by IN ('influencer', 'agent'));

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_influencer_promotions_initiated_by ON influencer_promotions(initiated_by);

-- Update RLS policies to handle agent-initiated requests
CREATE POLICY "Agents can invite influencers to promote their packages"
ON influencer_promotions
FOR INSERT
WITH CHECK (
  initiated_by = 'agent' AND
  package_id IN (
    SELECT ap.id FROM agent_packages ap
    JOIN travel_agents ta ON ta.id = ap.agent_id
    WHERE ta.user_id = auth.uid()
  )
);

CREATE POLICY "Influencers can update agent-initiated requests"
ON influencer_promotions
FOR UPDATE
USING (
  initiated_by = 'agent' AND
  influencer_id = auth.uid()
);