
-- 1) agent_applications: drop profiles.account_type-based admin policies
DROP POLICY IF EXISTS "Admins can update applications" ON public.agent_applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON public.agent_applications;

DROP POLICY IF EXISTS "Admins can update agent applications via role" ON public.agent_applications;
CREATE POLICY "Admins can update agent applications via role"
ON public.agent_applications
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2) application_audit_log
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.application_audit_log;
CREATE POLICY "Admins can view audit logs"
ON public.application_audit_log
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3) user_travel_preferences: keep account_type check (account_type is protected
-- from self-escalation by trigger trg_prevent_account_type_self_escalation);
-- also allow admins.
DROP POLICY IF EXISTS "Agents and creators can view discoverable preferences" ON public.user_travel_preferences;
CREATE POLICY "Agents and creators can view discoverable preferences"
ON public.user_travel_preferences
FOR SELECT
USING (
  is_discoverable = true
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.account_type = ANY (ARRAY['agent','creator'])
    )
  )
);

-- 4) Storage: trip-assets DELETE / UPDATE restricted to owner or admin
DROP POLICY IF EXISTS "Users can delete own trip assets" ON storage.objects;
CREATE POLICY "Users can delete own trip assets"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'trip-assets'
  AND (
    owner = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);

DROP POLICY IF EXISTS "Users can update own trip assets" ON storage.objects;
CREATE POLICY "Users can update own trip assets"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'trip-assets'
  AND (
    owner = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);

-- 5) Storage: proposal-attachments — INSERT must target caller's own folder
DROP POLICY IF EXISTS "Authenticated users can upload proposal attachments" ON storage.objects;
CREATE POLICY "Users upload own proposal attachments"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'proposal-attachments'
  AND auth.role() = 'authenticated'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- 6) Storage: email-assets — only admins can write
DROP POLICY IF EXISTS "Authenticated users can upload email assets" ON storage.objects;
CREATE POLICY "Admins can upload email assets"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'email-assets'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Authenticated users can update email assets" ON storage.objects;
CREATE POLICY "Admins can update email assets"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'email-assets'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Admins can delete email assets" ON storage.objects;
CREATE POLICY "Admins can delete email assets"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'email-assets'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);
