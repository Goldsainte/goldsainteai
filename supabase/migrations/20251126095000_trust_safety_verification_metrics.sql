-- Verification flags for brands and profiles
ALTER TABLE public.brand_profiles
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending'
    CHECK (verification_status IN ('pending','verified','rejected'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified','pending','verified','rejected'));

-- Trip assignment feedback for match quality
CREATE TABLE IF NOT EXISTS public.trip_assignment_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_assignment_id UUID NOT NULL REFERENCES public.trip_assignments(id) ON DELETE CASCADE,
  giver_role TEXT CHECK (giver_role IN ('traveler','creator_agent')) NOT NULL,
  rating INTEGER NOT NULL CHECK (rating IN (-1, 1)),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_assignment_feedback_assignment
  ON public.trip_assignment_feedback (trip_assignment_id);

-- Reporting and moderation queue
CREATE TABLE IF NOT EXISTS public.reported_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('collection','trip','user','message')),
  item_id UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewing','resolved','dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reported_items_status
  ON public.reported_items (status);

CREATE OR REPLACE FUNCTION public.handle_reported_items_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reported_items_updated_at ON public.reported_items;

CREATE TRIGGER trg_reported_items_updated_at
BEFORE UPDATE ON public.reported_items
FOR EACH ROW EXECUTE FUNCTION public.handle_reported_items_updated_at();

-- Stripe Connect-ready booking commission fields
ALTER TABLE public.trip_bookings
  ADD COLUMN IF NOT EXISTS platform_fee_cents INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS partner_payout_cents INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_rate_bps INTEGER DEFAULT 1500,
  ADD COLUMN IF NOT EXISTS connect_account_id TEXT,
  ADD COLUMN IF NOT EXISTS transfer_group TEXT;

-- Daily metrics rollup table
CREATE TABLE IF NOT EXISTS public.platform_metrics_daily (
  date DATE PRIMARY KEY,
  trip_requests_count INTEGER NOT NULL DEFAULT 0,
  trip_requests_with_assignments INTEGER NOT NULL DEFAULT 0,
  bookings_created INTEGER NOT NULL DEFAULT 0,
  bookings_in_escrow INTEGER NOT NULL DEFAULT 0,
  bookings_paid_out INTEGER NOT NULL DEFAULT 0,
  total_booked_gmv_cents BIGINT NOT NULL DEFAULT 0
);
