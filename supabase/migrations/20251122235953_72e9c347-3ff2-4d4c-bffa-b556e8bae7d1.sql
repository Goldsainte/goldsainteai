-- Create cancellation_policies table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.cancellation_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  full_refund_hours INTEGER NOT NULL,
  partial_refund_hours INTEGER,
  partial_refund_percentage NUMERIC(5,2),
  no_refund_hours INTEGER NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add some default policies
INSERT INTO public.cancellation_policies (name, description, full_refund_hours, partial_refund_hours, partial_refund_percentage, no_refund_hours, is_default)
VALUES 
  ('Standard Flexible', 'Full refund up to 48 hours before departure', 48, 24, 50, 24, true),
  ('Moderate', 'Full refund up to 72 hours, 50% refund up to 48 hours', 72, 48, 50, 48, false),
  ('Strict', 'Full refund up to 7 days, 50% refund up to 3 days', 168, 72, 50, 72, false)
ON CONFLICT (id) DO NOTHING;

-- Now add legal/commercial fields to trip_proposals
ALTER TABLE public.trip_proposals
  ADD COLUMN IF NOT EXISTS cancellation_policy_id UUID REFERENCES public.cancellation_policies(id),
  ADD COLUMN IF NOT EXISTS custom_cancellation_terms TEXT,
  ADD COLUMN IF NOT EXISTS deposit_percentage NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS deposit_due_days INTEGER,
  ADD COLUMN IF NOT EXISTS acknowledged_goldsainte_policies BOOLEAN DEFAULT false;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_trip_proposals_cancellation_policy 
  ON public.trip_proposals(cancellation_policy_id);

-- Add helpful comments
COMMENT ON COLUMN public.trip_proposals.cancellation_policy_id IS 'FK to standard cancellation policy chosen by proposer';
COMMENT ON COLUMN public.trip_proposals.custom_cancellation_terms IS 'Additional cancellation/refund terms specific to this proposal';
COMMENT ON COLUMN public.trip_proposals.deposit_percentage IS 'Required deposit percentage (0-100)';
COMMENT ON COLUMN public.trip_proposals.deposit_due_days IS 'Days after acceptance when deposit is due';
COMMENT ON COLUMN public.trip_proposals.acknowledged_goldsainte_policies IS 'Proposer confirmed marketplace terms';