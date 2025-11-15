-- Add tracking columns to trip_requests
ALTER TABLE public.trip_requests
  ADD COLUMN IF NOT EXISTS selected_proposal_id uuid REFERENCES public.trip_proposals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS booked_at timestamptz;

-- Add check constraint for status values
ALTER TABLE public.trip_requests
  DROP CONSTRAINT IF EXISTS trip_requests_status_check;

ALTER TABLE public.trip_requests
  ADD CONSTRAINT trip_requests_status_check 
  CHECK (status IN ('open', 'matched', 'booked', 'completed', 'archived'));

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_trip_requests_selected_proposal 
  ON public.trip_requests(selected_proposal_id) 
  WHERE selected_proposal_id IS NOT NULL;

-- Create trip_request_messages table
CREATE TABLE IF NOT EXISTS public.trip_request_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_request_id uuid NOT NULL REFERENCES public.trip_requests(id) ON DELETE CASCADE,
  proposal_id uuid REFERENCES public.trip_proposals(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trip_request_messages ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trip_request_messages_trip 
  ON public.trip_request_messages(trip_request_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trip_request_messages_proposal 
  ON public.trip_request_messages(proposal_id) 
  WHERE proposal_id IS NOT NULL;

-- RLS Policy: Participants can view messages
CREATE POLICY "Participants can view trip request messages"
ON public.trip_request_messages
FOR SELECT
USING (
  sender_id = auth.uid()
  OR trip_request_id IN (
    SELECT id FROM public.trip_requests WHERE user_id = auth.uid()
  )
  OR proposal_id IN (
    SELECT id FROM public.trip_proposals WHERE proposer_id = auth.uid()
  )
);

-- RLS Policy: Only participants can send messages
CREATE POLICY "Participants can insert trip request messages"
ON public.trip_request_messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND (
    trip_request_id IN (
      SELECT id FROM public.trip_requests WHERE user_id = auth.uid()
    )
    OR 
    proposal_id IN (
      SELECT id FROM public.trip_proposals WHERE proposer_id = auth.uid()
    )
  )
);

-- RLS Policy: Users can update read status on messages sent to them
CREATE POLICY "Recipients can mark messages as read"
ON public.trip_request_messages
FOR UPDATE
USING (
  sender_id != auth.uid()
  AND (
    trip_request_id IN (
      SELECT id FROM public.trip_requests WHERE user_id = auth.uid()
    )
    OR proposal_id IN (
      SELECT id FROM public.trip_proposals WHERE proposer_id = auth.uid()
    )
  )
)
WITH CHECK (
  sender_id != auth.uid()
);