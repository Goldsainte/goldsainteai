-- Drop existing table if it exists
DROP TABLE IF EXISTS public.booking_cancellations CASCADE;

-- Create booking_cancellations table
CREATE TABLE IF NOT EXISTS public.booking_cancellations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.trip_bookings(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL,
  requested_role TEXT NOT NULL,
  reason_short TEXT NOT NULL,
  reason_details TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending',
  decision_by UUID,
  decision_reason TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_requested_role CHECK (requested_role IN ('traveler', 'partner')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Enable RLS
ALTER TABLE public.booking_cancellations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Participants can view booking cancellations"
ON public.booking_cancellations
FOR SELECT
USING (
  booking_id IN (
    SELECT id FROM public.trip_bookings
    WHERE traveler_id = auth.uid() OR partner_id = auth.uid()
  )
);

CREATE POLICY "Participants can request cancellations"
ON public.booking_cancellations
FOR INSERT
WITH CHECK (requested_by = auth.uid());

-- Add insert policy for trip_bookings if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'trip_bookings' 
    AND policyname = 'Traveler can create bookings'
  ) THEN
    EXECUTE 'CREATE POLICY "Traveler can create bookings" ON public.trip_bookings FOR INSERT WITH CHECK (auth.uid() = traveler_id)';
  END IF;
END $$;