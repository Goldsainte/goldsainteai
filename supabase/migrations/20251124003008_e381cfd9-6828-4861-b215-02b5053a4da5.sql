-- Add email and name fields to agent_applications for anonymous submissions
-- These fields are required for applications submitted before user account creation

ALTER TABLE agent_applications
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- CREATE INDEX IF NOT EXISTS on email for efficient lookups
CREATE INDEX IF NOT EXISTS idx_agent_applications_email ON agent_applications(email);

-- Add email and name fields to brand_applications  
ALTER TABLE brand_applications
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- Make agent_id nullable since it won't exist until after approval
ALTER TABLE agent_applications
  ALTER COLUMN agent_id DROP NOT NULL;
