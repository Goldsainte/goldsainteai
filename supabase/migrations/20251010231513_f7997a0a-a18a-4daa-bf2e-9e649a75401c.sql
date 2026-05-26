-- Create package disputes table
CREATE TABLE IF NOT EXISTS public.package_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.package_bookings(id) ON DELETE CASCADE,
  package_id UUID NOT NULL,
  package_type TEXT NOT NULL CHECK (package_type IN ('cocurated', 'creator_package')),
  raised_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  dispute_type TEXT NOT NULL CHECK (dispute_type IN ('quality', 'delivery', 'payment', 'refund', 'communication', 'other')),
  description TEXT NOT NULL,
  evidence_urls JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'dismissed')),
  resolution TEXT,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.package_disputes ENABLE ROW LEVEL SECURITY;

-- Users can create disputes for their own bookings
CREATE POLICY "Users can create their own disputes"
ON public.package_disputes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = raised_by);

-- Users can view disputes they raised
CREATE POLICY "Users can view their own disputes"
ON public.package_disputes
FOR SELECT
TO authenticated
USING (auth.uid() = raised_by);

-- Creators can view disputes for their packages
CREATE POLICY "Creators can view disputes for their packages"
ON public.package_disputes
FOR SELECT
TO authenticated
USING (auth.uid() = creator_id);

-- Admins can view all disputes
CREATE POLICY "Admins can view all disputes"
ON public.package_disputes
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update disputes
CREATE POLICY "Admins can update disputes"
ON public.package_disputes
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- CREATE INDEX IF NOT EXISTS for faster lookups
CREATE INDEX IF NOT EXISTS idx_package_disputes_raised_by ON public.package_disputes(raised_by);
CREATE INDEX IF NOT EXISTS idx_package_disputes_creator_id ON public.package_disputes(creator_id);
CREATE INDEX IF NOT EXISTS idx_package_disputes_status ON public.package_disputes(status);
CREATE INDEX IF NOT EXISTS idx_package_disputes_booking_id ON public.package_disputes(booking_id);

-- Add updated_at trigger
CREATE TRIGGER update_package_disputes_updated_at
  BEFORE UPDATE ON public.package_disputes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
