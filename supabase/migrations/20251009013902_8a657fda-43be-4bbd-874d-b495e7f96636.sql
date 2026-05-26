-- Create quick_reply_templates table
CREATE TABLE IF NOT EXISTS public.quick_reply_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.travel_agents(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  shortcut TEXT,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quick_reply_templates ENABLE ROW LEVEL SECURITY;

-- Agents can view their own templates
CREATE POLICY "Agents can view their own templates"
ON public.quick_reply_templates
FOR SELECT
USING (agent_id IN (
  SELECT id FROM public.travel_agents WHERE user_id = auth.uid()
));

-- Agents can create their own templates
CREATE POLICY "Agents can create their own templates"
ON public.quick_reply_templates
FOR INSERT
WITH CHECK (agent_id IN (
  SELECT id FROM public.travel_agents WHERE user_id = auth.uid()
));

-- Agents can update their own templates
CREATE POLICY "Agents can update their own templates"
ON public.quick_reply_templates
FOR UPDATE
USING (agent_id IN (
  SELECT id FROM public.travel_agents WHERE user_id = auth.uid()
));

-- Agents can delete their own templates
CREATE POLICY "Agents can delete their own templates"
ON public.quick_reply_templates
FOR DELETE
USING (agent_id IN (
  SELECT id FROM public.travel_agents WHERE user_id = auth.uid()
));

-- Create trigger for updated_at
CREATE TRIGGER update_quick_reply_templates_updated_at
  BEFORE UPDATE ON public.quick_reply_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- CREATE INDEX IF NOT EXISTS for faster queries
CREATE INDEX IF NOT EXISTS idx_quick_reply_templates_agent_id ON public.quick_reply_templates(agent_id);
CREATE INDEX IF NOT EXISTS idx_quick_reply_templates_category ON public.quick_reply_templates(category);

-- Insert default templates (these will be available to all agents)
-- Note: We'll create a special "system" agent or these can be copied when agents sign up
-- For now, we'll create them as default templates that can be referenced

COMMENT ON TABLE public.quick_reply_templates IS 'Quick reply message templates for travel agents';
COMMENT ON COLUMN public.quick_reply_templates.shortcut IS 'Optional keyboard shortcut for quick access';
COMMENT ON COLUMN public.quick_reply_templates.usage_count IS 'Tracks how many times this template has been used';

