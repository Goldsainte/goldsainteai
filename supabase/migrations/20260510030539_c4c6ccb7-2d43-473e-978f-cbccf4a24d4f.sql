
ALTER TABLE public.trip_bookings ALTER COLUMN partner_id DROP NOT NULL;

ALTER TABLE public.trip_bookings
  ADD COLUMN IF NOT EXISTS deposit_amount integer,
  ADD COLUMN IF NOT EXISTS deposit_percentage numeric,
  ADD COLUMN IF NOT EXISTS payout_paid_at timestamptz;

ALTER TABLE public.trip_bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE public.trip_bookings ADD CONSTRAINT bookings_status_check
  CHECK (status = ANY (ARRAY[
    'pending'::text,
    'pending_payment'::text,
    'deposit_pending'::text,
    'payment_pending'::text,
    'confirmed'::text,
    'in_progress'::text,
    'completed'::text,
    'cancelled'::text,
    'disputed'::text
  ]));

ALTER TABLE public.direct_messages
  ADD COLUMN IF NOT EXISTS message_type text NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
