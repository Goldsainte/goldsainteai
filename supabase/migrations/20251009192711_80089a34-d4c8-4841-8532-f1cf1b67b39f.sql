-- Update default agent name for AI agent profiles
ALTER TABLE public.ai_agent_profiles 
ALTER COLUMN agent_name SET DEFAULT 'Goldsainte AI Travel Concierge';

-- Update any existing profiles with the old default name
UPDATE public.ai_agent_profiles 
SET agent_name = 'Goldsainte AI Travel Concierge' 
WHERE agent_name = 'My Travel Assistant';