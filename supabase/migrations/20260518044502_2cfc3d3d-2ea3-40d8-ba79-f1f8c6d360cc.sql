-- 1. Lock down package_post_tags
DROP POLICY IF EXISTS "tags_insert" ON public.package_post_tags;
DROP POLICY IF EXISTS "tags_delete" ON public.package_post_tags;

CREATE POLICY "Package owners can insert tags"
  ON public.package_post_tags FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.packaged_trips pt WHERE pt.id = package_post_tags.package_id AND (pt.creator_id = auth.uid() OR pt.agent_id = auth.uid())));

CREATE POLICY "Package owners can delete tags"
  ON public.package_post_tags FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.packaged_trips pt WHERE pt.id = package_post_tags.package_id AND (pt.creator_id = auth.uid() OR pt.agent_id = auth.uid())));

-- 2. Restrict service tables to service_role
DROP POLICY IF EXISTS "System can insert AI usage logs" ON public.ai_usage_logs;
CREATE POLICY "Service role can insert AI usage logs" ON public.ai_usage_logs FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "System can insert response tracking" ON public.agent_response_tracking;
CREATE POLICY "Service role can insert response tracking" ON public.agent_response_tracking FOR INSERT TO service_role WITH CHECK (true);

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='api_error_logs') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Service role can insert error logs" ON public.api_error_logs';
    EXECUTE 'CREATE POLICY "Service role can insert error logs" ON public.api_error_logs FOR INSERT TO service_role WITH CHECK (true)';
  END IF;
END $$;

DROP POLICY IF EXISTS "Service role can insert city image usage" ON public.city_image_usage;
DROP POLICY IF EXISTS "Service role can update city image usage" ON public.city_image_usage;
CREATE POLICY "Service role can insert city image usage" ON public.city_image_usage FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role can update city image usage" ON public.city_image_usage FOR UPDATE TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can insert processed payments" ON public.processed_payments;
CREATE POLICY "Service role can insert processed payments" ON public.processed_payments FOR INSERT TO service_role WITH CHECK (true);

-- 3. Pin search_path on email infra functions
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;