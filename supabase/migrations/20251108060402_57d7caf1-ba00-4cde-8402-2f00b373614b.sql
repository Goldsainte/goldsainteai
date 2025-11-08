-- Create booking cancellation policies table
CREATE TABLE IF NOT EXISTS public.booking_cancellation_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_name TEXT NOT NULL,
  booking_type TEXT NOT NULL CHECK (booking_type IN ('hotel', 'flight', 'car')),
  hours_before_checkin INTEGER NOT NULL,
  refund_percentage NUMERIC(5,2) NOT NULL CHECK (refund_percentage >= 0 AND refund_percentage <= 100),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create booking cancellations table
CREATE TABLE IF NOT EXISTS public.booking_cancellations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cancellation_reason TEXT,
  cancellation_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  policy_applied_id UUID REFERENCES public.booking_cancellation_policies(id),
  refund_percentage NUMERIC(5,2) NOT NULL,
  refund_amount NUMERIC(10,2) NOT NULL,
  original_amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  admin_notes TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create booking refunds table
CREATE TABLE IF NOT EXISTS public.booking_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cancellation_id UUID NOT NULL REFERENCES public.booking_cancellations(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT,
  stripe_refund_id TEXT,
  refund_amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled')),
  failure_reason TEXT,
  refunded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add cancellation status to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS cancellation_status TEXT DEFAULT 'active' CHECK (cancellation_status IN ('active', 'cancellation_requested', 'cancelled', 'refunded'));

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS cancellation_policy_id UUID REFERENCES public.booking_cancellation_policies(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_booking_cancellations_booking_id ON public.booking_cancellations(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_cancellations_user_id ON public.booking_cancellations(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_cancellations_status ON public.booking_cancellations(status);
CREATE INDEX IF NOT EXISTS idx_booking_refunds_cancellation_id ON public.booking_refunds(cancellation_id);
CREATE INDEX IF NOT EXISTS idx_booking_refunds_booking_id ON public.booking_refunds(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_refunds_status ON public.booking_refunds(status);

-- Enable RLS
ALTER TABLE public.booking_cancellation_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_cancellations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_refunds ENABLE ROW LEVEL SECURITY;

-- RLS Policies for booking_cancellation_policies
CREATE POLICY "Anyone can view active cancellation policies"
  ON public.booking_cancellation_policies
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage cancellation policies"
  ON public.booking_cancellation_policies
  FOR ALL
  USING (public.is_admin());

-- RLS Policies for booking_cancellations
CREATE POLICY "Users can view their own cancellations"
  ON public.booking_cancellations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cancellations"
  ON public.booking_cancellations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all cancellations"
  ON public.booking_cancellations
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update cancellations"
  ON public.booking_cancellations
  FOR UPDATE
  USING (public.is_admin());

-- RLS Policies for booking_refunds
CREATE POLICY "Users can view their own refunds"
  ON public.booking_refunds
  FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM public.bookings WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all refunds"
  ON public.booking_refunds
  FOR SELECT
  USING (public.is_admin());

-- Create triggers for updated_at
CREATE TRIGGER update_booking_cancellations_updated_at
  BEFORE UPDATE ON public.booking_cancellations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_booking_refunds_updated_at
  BEFORE UPDATE ON public.booking_refunds
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_booking_cancellation_policies_updated_at
  BEFORE UPDATE ON public.booking_cancellation_policies
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert default cancellation policies
INSERT INTO public.booking_cancellation_policies (policy_name, booking_type, hours_before_checkin, refund_percentage, description) VALUES
('Hotel - Full Refund', 'hotel', 48, 100, 'Cancel 48+ hours before check-in for full refund'),
('Hotel - Partial Refund', 'hotel', 24, 50, 'Cancel 24-48 hours before check-in for 50% refund'),
('Hotel - No Refund', 'hotel', 0, 0, 'Cancel less than 24 hours before check-in - no refund'),
('Flight - Full Refund', 'flight', 72, 90, 'Cancel 72+ hours before departure for 90% refund (10% admin fee)'),
('Flight - Partial Refund', 'flight', 24, 50, 'Cancel 24-72 hours before departure for 50% refund'),
('Flight - No Refund', 'flight', 0, 0, 'Cancel less than 24 hours before departure - no refund'),
('Car - Full Refund', 'car', 24, 100, 'Cancel 24+ hours before pickup for full refund'),
('Car - No Refund', 'car', 0, 0, 'Cancel less than 24 hours before pickup - no refund')
ON CONFLICT DO NOTHING;