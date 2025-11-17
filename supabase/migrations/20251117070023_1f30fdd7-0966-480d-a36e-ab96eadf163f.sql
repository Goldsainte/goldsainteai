-- Add admin_notes column to agent_applications table
ALTER TABLE agent_applications
ADD COLUMN IF NOT EXISTS admin_notes TEXT;