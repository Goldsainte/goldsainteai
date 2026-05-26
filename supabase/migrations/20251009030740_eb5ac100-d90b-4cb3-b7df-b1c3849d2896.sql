-- CREATE TABLE IF NOT EXISTS for AI agent personalization
CREATE TABLE IF NOT EXISTS public.ai_agent_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL DEFAULT 'My Travel Assistant',
  voice TEXT NOT NULL DEFAULT 'alloy',
  personality_instructions TEXT,
  custom_knowledge JSONB DEFAULT '[]'::jsonb,
  preferred_language TEXT DEFAULT 'en',
  communication_style TEXT DEFAULT 'professional',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.ai_agent_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view and manage their own AI agent
CREATE POLICY "Users can view their own AI agent"
  ON public.ai_agent_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI agent"
  ON public.ai_agent_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI agent"
  ON public.ai_agent_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_ai_agent_profiles_updated_at
  BEFORE UPDATE ON public.ai_agent_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- CREATE INDEX IF NOT EXISTS for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_agent_profiles_user_id ON public.ai_agent_profiles(user_id);
