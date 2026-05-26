-- Add new columns for inquiry-to-marketplace tracking (fixed version)

-- Add marketplace_job_id to agent_inquiries
ALTER TABLE agent_inquiries 
ADD COLUMN IF NOT EXISTS marketplace_job_id UUID REFERENCES marketplace_jobs(id),
ADD COLUMN IF NOT EXISTS matched_agent_ids UUID[],
ADD COLUMN IF NOT EXISTS notification_sent_at TIMESTAMP WITH TIME ZONE;

-- Add inquiry tracking to marketplace_jobs
ALTER TABLE marketplace_jobs
ADD COLUMN IF NOT EXISTS inquiry_source TEXT,
ADD COLUMN IF NOT EXISTS ai_matched_agents UUID[],
ADD COLUMN IF NOT EXISTS contact_info JSONB;

-- CREATE INDEX IF NOT EXISTS for faster lookups
CREATE INDEX IF NOT EXISTS idx_agent_inquiries_marketplace_job ON agent_inquiries(marketplace_job_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_jobs_inquiry_source ON marketplace_jobs(inquiry_source);

-- Enable realtime for marketplace tables (notifications already enabled)
ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE agent_bids;
