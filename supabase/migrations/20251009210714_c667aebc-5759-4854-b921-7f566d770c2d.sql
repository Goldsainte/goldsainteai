-- Add tracking fields to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS booking_source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES public.travel_agents(id);

-- Add check constraint for booking_source
ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_source_check 
CHECK (booking_source IN ('manual', 'ai_agent', 'ai_concierge', 'marketplace_agent'));

-- Add check constraint for payment_status
ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_payment_status_check 
CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded'));

-- Add index for querying by booking source
CREATE INDEX IF NOT EXISTS idx_bookings_source ON public.bookings(booking_source);

-- Add index for querying by payment status
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.bookings(payment_status);

COMMENT ON COLUMN public.bookings.booking_source IS 'Source of the booking: manual (user direct), ai_agent (AI booking assistant), ai_concierge (AI concierge service), marketplace_agent (travel agent from marketplace)';
COMMENT ON COLUMN public.bookings.payment_status IS 'Payment status: pending, processing, completed, failed, refunded';
COMMENT ON COLUMN public.bookings.agent_id IS 'Travel agent ID if booked through marketplace';