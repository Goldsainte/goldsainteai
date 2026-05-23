-- Agent self-serve: remove the manual admin approval gate.
-- Brand applications retain admin approval flow.

DROP POLICY IF EXISTS "Admins can update agent applications" ON public.agent_applications;
DROP POLICY IF EXISTS "Admins can update agent applications via role" ON public.agent_applications;

-- We still want admins to be able to retry account provisioning when the
-- webhook fails, so add back a narrower update policy gated on the
-- existing has_role() helper.
CREATE POLICY "Admins can recover stuck agent applications"
ON public.agent_applications
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

COMMENT ON COLUMN public.agent_applications.status IS
  'Lifecycle (self-serve): pending_verification -> verified | rejected | failed. Verified = live account; no separate approved stage.';