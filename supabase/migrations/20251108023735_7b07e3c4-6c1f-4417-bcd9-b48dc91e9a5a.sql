-- Add settings columns to group_trips table
ALTER TABLE public.group_trips
ADD COLUMN IF NOT EXISTS spending_limits JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{"new_suggestion": true, "high_votes": true, "participant_joined": true, "budget_alert": true}'::jsonb;

-- Add role column to trip_members
ALTER TABLE public.trip_members
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member'));

-- Update existing members to have default role
UPDATE public.trip_members
SET role = 'member'
WHERE role IS NULL;

-- Set creators as admin
UPDATE public.trip_members tm
SET role = 'admin'
FROM public.group_trips gt
WHERE tm.trip_id = gt.id 
  AND tm.user_id = gt.creator_id;