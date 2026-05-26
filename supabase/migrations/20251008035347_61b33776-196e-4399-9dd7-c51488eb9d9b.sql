-- Create agent_inquiries table to track when users request agent contact from AI
CREATE TABLE IF NOT EXISTS public.agent_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  guest_email TEXT,
  guest_name TEXT,
  guest_phone TEXT,
  inquiry_source TEXT NOT NULL DEFAULT 'ai_chat', -- 'ai_chat', 'ai_voice', 'website'
  conversation_data JSONB NOT NULL DEFAULT '{}', -- Stores messages, preferences, travel details
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'contacted', 'converted', 'closed'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  assigned_agent_id UUID REFERENCES public.travel_agents(id),
  ai_match_score NUMERIC,
  notes TEXT,
  contacted_at TIMESTAMP WITH TIME ZONE,
  converted_to_job_id UUID REFERENCES public.marketplace_jobs(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_inquiries ENABLE ROW LEVEL SECURITY;

-- Admins can see all inquiries
CREATE POLICY "Admins can view all inquiries"
  ON public.agent_inquiries
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Admins can update inquiries
CREATE POLICY "Admins can update inquiries"
  ON public.agent_inquiries
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Assigned agents can view their inquiries
CREATE POLICY "Agents can view assigned inquiries"
  ON public.agent_inquiries
  FOR SELECT
  TO authenticated
  USING (
    assigned_agent_id IN (
      SELECT id FROM public.travel_agents WHERE user_id = auth.uid()
    )
  );

-- Service role can insert inquiries (from AI chat)
CREATE POLICY "Service role can insert inquiries"
  ON public.agent_inquiries
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Users can view their own inquiries
CREATE POLICY "Users can view their own inquiries"
  ON public.agent_inquiries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- CREATE INDEX IF NOT EXISTS for faster queries
CREATE INDEX IF NOT EXISTS idx_agent_inquiries_status ON public.agent_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_agent_inquiries_created_at ON public.agent_inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_inquiries_assigned_agent ON public.agent_inquiries(assigned_agent_id);

-- Add trigger for updated_at
CREATE TRIGGER update_agent_inquiries_updated_at
  BEFORE UPDATE ON public.agent_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
