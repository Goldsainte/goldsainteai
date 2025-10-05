-- Add dispute resolution fields to marketplace_jobs
ALTER TABLE public.marketplace_jobs
ADD COLUMN IF NOT EXISTS dispute_reason text,
ADD COLUMN IF NOT EXISTS dispute_opened_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS dispute_resolved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS dispute_resolution text;

-- Create disputes table for detailed dispute tracking
CREATE TABLE IF NOT EXISTS public.marketplace_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.marketplace_jobs(id) ON DELETE CASCADE,
  raised_by uuid NOT NULL REFERENCES auth.users(id),
  dispute_type text NOT NULL CHECK (dispute_type IN ('quality', 'delivery', 'communication', 'refund', 'other')),
  description text NOT NULL,
  evidence jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'closed')),
  resolution_notes text,
  resolved_by uuid REFERENCES auth.users(id),
  resolved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- RLS for disputes
ALTER TABLE public.marketplace_disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "disputes_view_involved"
ON public.marketplace_disputes
FOR SELECT
USING (
  raised_by = auth.uid() OR
  job_id IN (
    SELECT id FROM public.marketplace_jobs 
    WHERE user_id = auth.uid() OR assigned_agent_id IN (
      SELECT id FROM public.travel_agents WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "disputes_create_involved"
ON public.marketplace_disputes
FOR INSERT
WITH CHECK (
  raised_by = auth.uid() AND
  job_id IN (
    SELECT id FROM public.marketplace_jobs 
    WHERE user_id = auth.uid() OR assigned_agent_id IN (
      SELECT id FROM public.travel_agents WHERE user_id = auth.uid()
    )
  )
);

-- Create job attachments table for file uploads
CREATE TABLE IF NOT EXISTS public.marketplace_job_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.marketplace_jobs(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id),
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size bigint,
  mime_type text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.marketplace_job_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attachments_view_job_participants"
ON public.marketplace_job_attachments
FOR SELECT
USING (
  job_id IN (
    SELECT id FROM public.marketplace_jobs 
    WHERE user_id = auth.uid() OR assigned_agent_id IN (
      SELECT id FROM public.travel_agents WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "attachments_upload_participants"
ON public.marketplace_job_attachments
FOR INSERT
WITH CHECK (
  uploaded_by = auth.uid() AND
  job_id IN (
    SELECT id FROM public.marketplace_jobs 
    WHERE user_id = auth.uid() OR assigned_agent_id IN (
      SELECT id FROM public.travel_agents WHERE user_id = auth.uid()
    )
  )
);

-- Create agent availability table
CREATE TABLE IF NOT EXISTS public.agent_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.travel_agents(id) ON DELETE CASCADE,
  date date NOT NULL,
  is_available boolean DEFAULT true NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(agent_id, date)
);

ALTER TABLE public.agent_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "availability_public_view"
ON public.agent_availability
FOR SELECT
USING (true);

CREATE POLICY "availability_agent_manage"
ON public.agent_availability
FOR ALL
USING (
  agent_id IN (SELECT id FROM public.travel_agents WHERE user_id = auth.uid())
)
WITH CHECK (
  agent_id IN (SELECT id FROM public.travel_agents WHERE user_id = auth.uid())
);

-- Add cancellation policy fields to travel_agents
ALTER TABLE public.travel_agents
ADD COLUMN IF NOT EXISTS cancellation_hours_before integer DEFAULT 24,
ADD COLUMN IF NOT EXISTS cancellation_fee_percentage numeric DEFAULT 10.0;

-- Create storage bucket for job attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'job-attachments',
  'job-attachments',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for job attachments
CREATE POLICY "job_attachments_upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'job-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "job_attachments_view"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'job-attachments'
);

CREATE POLICY "job_attachments_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'job-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);