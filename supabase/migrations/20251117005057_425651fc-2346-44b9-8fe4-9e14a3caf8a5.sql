
-- Extend bookings table for creator/agent earnings (idempotent)
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS creator_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS creator_earnings numeric(12,2),
  ADD COLUMN IF NOT EXISTS agent_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS agent_earnings numeric(12,2),
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS payout_status text DEFAULT 'not_eligible',
  ADD COLUMN IF NOT EXISTS payout_expected_at timestamptz,
  ADD COLUMN IF NOT EXISTS payout_paid_at timestamptz;

-- Add constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bookings_payout_status_check'
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_payout_status_check
      CHECK (payout_status IN ('not_eligible', 'pending', 'partial', 'paid', 'on_hold'));
  END IF;
END $$;

-- Create indexes for efficient earnings queries
CREATE INDEX IF NOT EXISTS bookings_creator_id_idx ON public.bookings(creator_id);
CREATE INDEX IF NOT EXISTS bookings_agent_id_idx ON public.bookings(agent_id);
