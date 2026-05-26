-- CREATE TABLE IF NOT EXISTS to track individual traveler payments in group bookings
CREATE TABLE IF NOT EXISTS public.group_booking_travelers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.marketplace_jobs(id) ON DELETE CASCADE,
  traveler_email TEXT NOT NULL,
  traveler_name TEXT NOT NULL,
  traveler_number INTEGER NOT NULL, -- e.g., 1, 2, 3, 4 for traveler order
  amount_owed NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'refunded'
  payment_intent_id TEXT,
  stripe_payment_link TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_reminder_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(job_id, traveler_email)
);

-- Enable RLS
ALTER TABLE public.group_booking_travelers ENABLE ROW LEVEL SECURITY;

-- Job owners can view their group booking travelers
CREATE POLICY "Job owners can view group travelers"
ON public.group_booking_travelers
FOR SELECT
USING (
  job_id IN (
    SELECT id FROM public.marketplace_jobs 
    WHERE user_id = auth.uid()
  )
);

-- Job owners can create group travelers
CREATE POLICY "Job owners can create group travelers"
ON public.group_booking_travelers
FOR INSERT
WITH CHECK (
  job_id IN (
    SELECT id FROM public.marketplace_jobs 
    WHERE user_id = auth.uid()
  )
);

-- Service role can update payment status
CREATE POLICY "Service role can update group travelers"
ON public.group_booking_travelers
FOR UPDATE
USING (
  ((current_setting('request.jwt.claims', true)::json->>'role') = 'service_role')
);

-- Agents assigned to jobs can view group travelers
CREATE POLICY "Agents can view assigned job travelers"
ON public.group_booking_travelers
FOR SELECT
USING (
  job_id IN (
    SELECT id FROM public.marketplace_jobs 
    WHERE assigned_agent_id IN (
      SELECT id FROM public.travel_agents 
      WHERE user_id = auth.uid()
    )
  )
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_group_travelers_job_id ON public.group_booking_travelers(job_id);
CREATE INDEX IF NOT EXISTS idx_group_travelers_payment_status ON public.group_booking_travelers(payment_status);

-- Update trigger for updated_at
CREATE TRIGGER update_group_booking_travelers_updated_at
BEFORE UPDATE ON public.group_booking_travelers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add columns to marketplace_jobs for group payment tracking
ALTER TABLE public.marketplace_jobs
ADD COLUMN IF NOT EXISTS is_group_booking BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS group_payment_mode TEXT, -- 'single_payer', 'split_equal', 'custom_split'
ADD COLUMN IF NOT EXISTS group_organizer_email TEXT,
ADD COLUMN IF NOT EXISTS total_travelers INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS payments_collected INTEGER DEFAULT 0;
