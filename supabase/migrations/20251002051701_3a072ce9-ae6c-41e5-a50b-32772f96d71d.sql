-- Create booking_modifications table to track changes to bookings
CREATE TABLE IF NOT EXISTS public.booking_modifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  modification_type TEXT NOT NULL CHECK (modification_type IN ('cancel', 'modify', 'refund')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  original_booking_data JSONB NOT NULL,
  new_booking_data JSONB,
  amadeus_order_id TEXT,
  refund_amount NUMERIC,
  refund_currency TEXT DEFAULT 'USD',
  refund_status TEXT CHECK (refund_status IN ('pending', 'processing', 'completed', 'failed')),
  cancellation_fee NUMERIC DEFAULT 0,
  change_fee NUMERIC DEFAULT 0,
  fare_difference NUMERIC,
  reason TEXT,
  notes TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- CREATE INDEX IF NOT EXISTS for faster queries
CREATE INDEX IF NOT EXISTS idx_booking_modifications_booking_id ON public.booking_modifications(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_modifications_user_id ON public.booking_modifications(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_modifications_status ON public.booking_modifications(status);

-- Enable RLS
ALTER TABLE public.booking_modifications ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own booking modifications"
  ON public.booking_modifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own booking modifications"
  ON public.booking_modifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all modifications"
  ON public.booking_modifications
  FOR ALL
  USING (((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'service_role'::text);

-- Add trigger for updated_at
CREATE TRIGGER update_booking_modifications_updated_at
  BEFORE UPDATE ON public.booking_modifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
