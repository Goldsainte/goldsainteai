
-- ============ Privilege escalation: drop legacy profiles.role policies ============
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all agents" ON public.travel_agents;
CREATE POLICY "Admins can manage all agents"
  ON public.travel_agents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
CREATE POLICY "Admins can view all bookings"
  ON public.bookings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Defence-in-depth: prevent users from writing the legacy profiles.role column at all
CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.role IS DISTINCT FROM OLD.role
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.role := OLD.role;
  END IF;
  IF TG_OP = 'INSERT' AND NEW.role IS NOT NULL
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.role := NULL;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS profiles_prevent_role_escalation ON public.profiles;
CREATE TRIGGER profiles_prevent_role_escalation
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_role_escalation();

-- ============ Profiles: remove public-true SELECT policies ============
DROP POLICY IF EXISTS "Public can view basic profile info" ON public.profiles;
DROP POLICY IF EXISTS "Public can view profiles read-only" ON public.profiles;
-- Keep "Users can view own profile" / "Users can view their own profile" / "Users can view own full profile"
-- and the service_role manage policy. Public consumers must use the public_profiles view.

-- ============ Storage buckets ============
DROP POLICY IF EXISTS "Public read verification-documents" ON storage.objects;
DROP POLICY IF EXISTS "Public read vendor-documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view own application documents" ON storage.objects;

CREATE POLICY "Users can view own application documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'application-documents'
         AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users view own verification-documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'verification-documents'
         AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users view own vendor-documents folder"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'vendor-documents'
         AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can view their own proposal attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own proposal attachments" ON storage.objects;
CREATE POLICY "Users view own proposal attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'proposal-attachments'
         AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own proposal attachments"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'proposal-attachments'
         AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "job_attachments_view" ON storage.objects;
CREATE POLICY "job_attachments_view_owner"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'job-attachments'
         AND (auth.uid())::text = (storage.foldername(name))[1]);

-- ============ rate_limits: service role only ============
DROP POLICY IF EXISTS "Service role can manage rate limits" ON public.rate_limits;
CREATE POLICY "Service role manages rate limits"
  ON public.rate_limits FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============ search_cache: read public, write service only ============
DROP POLICY IF EXISTS "Allow public write access to search cache" ON public.search_cache;
DROP POLICY IF EXISTS "Allow public update access to search cache" ON public.search_cache;
CREATE POLICY "Service role writes search cache"
  ON public.search_cache FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role updates search cache"
  ON public.search_cache FOR UPDATE TO service_role USING (true) WITH CHECK (true);
