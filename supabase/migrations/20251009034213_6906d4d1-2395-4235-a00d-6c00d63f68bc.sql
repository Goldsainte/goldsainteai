-- Add travel_preferences column to ai_agent_profiles
ALTER TABLE public.ai_agent_profiles 
ADD COLUMN IF NOT EXISTS travel_preferences jsonb DEFAULT '{}'::jsonb;