
-- 1. Prevent privilege escalation via profiles.account_type
CREATE OR REPLACE FUNCTION public.prevent_account_type_self_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.account_type IS DISTINCT FROM OLD.account_type THEN
    IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
      RAISE EXCEPTION 'Not authorized to change account_type';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_account_type_self_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_account_type_self_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_account_type_self_escalation();

-- 2. Make KYC / document buckets private
UPDATE storage.buckets
SET public = false
WHERE id IN ('verification-documents', 'vendor-documents', 'application-documents');

-- 3. Restrict cocurated_trip_requests pending visibility to authenticated agents/admins
DROP POLICY IF EXISTS "Agents can view all pending trip requests" ON public.cocurated_trip_requests;

CREATE POLICY "Agents can view pending trip requests"
ON public.cocurated_trip_requests
FOR SELECT
TO authenticated
USING (
  status = 'pending'
  AND (
    public.has_role(auth.uid(), 'agent'::public.app_role)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);
