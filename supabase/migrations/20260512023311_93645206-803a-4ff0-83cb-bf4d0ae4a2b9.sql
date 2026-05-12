-- Add creator approval columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS creator_status text NOT NULL DEFAULT 'pending'
    CHECK (creator_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS creator_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS creator_approved_by uuid,
  ADD COLUMN IF NOT EXISTS creator_rejection_reason text;

-- Existing creators are grandfathered in as approved so nothing breaks
UPDATE public.profiles
SET creator_status = 'approved',
    creator_approved_at = COALESCE(creator_approved_at, now())
WHERE account_type = 'creator'
  AND creator_status = 'pending';

-- Admins can update creator_status (uses existing has_role function)
CREATE POLICY "Admins can update creator approval"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
