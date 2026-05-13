-- Read-only helper exposing cron job status to service-role callers so the
-- email-infrastructure health check can verify process-email-queue exists
-- and is active. Returns no secrets — only schedule + active flag.
CREATE OR REPLACE FUNCTION public.email_infra_cron_status()
RETURNS TABLE(jobid bigint, jobname text, schedule text, active boolean)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, cron
AS $$
  SELECT j.jobid, j.jobname, j.schedule, j.active
  FROM cron.job j
  WHERE j.jobname IN ('process-email-queue', 'dispatch-message-email');
$$;

REVOKE ALL ON FUNCTION public.email_infra_cron_status() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.email_infra_cron_status() TO service_role;