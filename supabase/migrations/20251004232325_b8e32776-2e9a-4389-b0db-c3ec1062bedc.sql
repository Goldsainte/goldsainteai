-- Add completion workflow fields to marketplace_jobs
ALTER TABLE public.marketplace_jobs
ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS customer_approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS completion_notes text,
ADD COLUMN IF NOT EXISTS rejection_reason text,
ADD COLUMN IF NOT EXISTS funds_released boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS funds_released_at timestamp with time zone;

-- Update status enum to include new workflow states
COMMENT ON COLUMN public.marketplace_jobs.status IS 'Possible values: open, assigned, in_progress, pending_approval, completed, cancelled, disputed, expired';

-- Add agent completion submission tracking
CREATE TABLE IF NOT EXISTS public.job_completion_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.marketplace_jobs(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL,
  submitted_at timestamp with time zone NOT NULL DEFAULT now(),
  completion_notes text,
  deliverables_description text,
  attachments jsonb DEFAULT '[]'::jsonb,
  customer_response text,
  customer_response_at timestamp with time zone,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'revision_requested')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on job_completion_submissions
ALTER TABLE public.job_completion_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for job_completion_submissions
CREATE POLICY "completion_view_involved_parties"
ON public.job_completion_submissions
FOR SELECT
USING (
  agent_id IN (SELECT id FROM travel_agents WHERE user_id = auth.uid())
  OR 
  job_id IN (SELECT id FROM marketplace_jobs WHERE user_id = auth.uid())
);

CREATE POLICY "completion_agents_create"
ON public.job_completion_submissions
FOR INSERT
WITH CHECK (
  agent_id IN (SELECT id FROM travel_agents WHERE user_id = auth.uid())
);

CREATE POLICY "completion_customers_update"
ON public.job_completion_submissions
FOR UPDATE
USING (
  job_id IN (SELECT id FROM marketplace_jobs WHERE user_id = auth.uid())
);

-- Add trigger for updated_at
CREATE TRIGGER update_job_completion_submissions_updated_at
BEFORE UPDATE ON public.job_completion_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_job_completion_submissions_job_id ON public.job_completion_submissions(job_id);
CREATE INDEX IF NOT EXISTS idx_job_completion_submissions_agent_id ON public.job_completion_submissions(agent_id);

-- Update payment tracking in payments table
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS escrow_held boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS transferred_to_agent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS transfer_id text,
ADD COLUMN IF NOT EXISTS transferred_at timestamp with time zone;

COMMENT ON COLUMN public.payments.escrow_held IS 'Whether funds are held in escrow until job completion approval';