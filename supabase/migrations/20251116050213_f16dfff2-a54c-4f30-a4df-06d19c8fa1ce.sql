-- Add proposal lifecycle columns
ALTER TABLE public.trip_proposals
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'sent',
  ADD COLUMN IF NOT EXISTS valid_until timestamptz,
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS declined_at timestamptz,
  ADD COLUMN IF NOT EXISTS withdrawn_at timestamptz;

-- Add comment explaining status values
COMMENT ON COLUMN public.trip_proposals.status IS 'draft | sent | traveler_review | accepted | declined | expired | withdrawn';

-- Add booking lifecycle columns
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending_payment',
  ADD COLUMN IF NOT EXISTS payout_status text NOT NULL DEFAULT 'not_eligible',
  ADD COLUMN IF NOT EXISTS escrow_released_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS disputed_at timestamptz;

-- Add comments explaining status values
COMMENT ON COLUMN public.bookings.status IS 'pending_payment | deposit_paid | paid_in_full | in_escrow | completed | cancelled_refunded | disputed';
COMMENT ON COLUMN public.bookings.payout_status IS 'not_eligible | pending | partial | paid | on_hold';