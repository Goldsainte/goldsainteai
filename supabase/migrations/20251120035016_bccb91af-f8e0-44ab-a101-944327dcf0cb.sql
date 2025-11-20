-- Add Stripe Checkout fields to trip_bookings table
ALTER TABLE public.trip_bookings
  ADD COLUMN IF NOT EXISTS payment_url TEXT,
  ADD COLUMN IF NOT EXISTS payment_client_secret TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add index for efficient payment reference lookups
CREATE INDEX IF NOT EXISTS idx_trip_bookings_payment_reference 
  ON public.trip_bookings(stripe_payment_intent_id);

-- Add comments for documentation
COMMENT ON COLUMN public.trip_bookings.payment_url IS 'Stripe Checkout Session URL for travelers to complete payment';
COMMENT ON COLUMN public.trip_bookings.payment_client_secret IS 'Optional client secret for PaymentIntent flows';
COMMENT ON COLUMN public.trip_bookings.metadata IS 'Additional booking metadata (brand, collection, trip context)';