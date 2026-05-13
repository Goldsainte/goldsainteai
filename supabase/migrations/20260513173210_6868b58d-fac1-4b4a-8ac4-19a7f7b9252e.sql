CREATE OR REPLACE FUNCTION public.email_infra_cron_last_run()
RETURNS TABLE (
  last_run timestamptz,
  last_successful_run timestamptz,
  total_active_jobs integer,
  recent_failures integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, cron
AS $$
  SELECT
    (SELECT max(start_time) FROM cron.job_run_details) AS last_run,
    (SELECT max(start_time) FROM cron.job_run_details WHERE status = 'succeeded') AS last_successful_run,
    (SELECT count(*)::int FROM cron.job WHERE active = true) AS total_active_jobs,
    (SELECT count(*)::int FROM cron.job_run_details
       WHERE status = 'failed' AND start_time > now() - interval '1 hour') AS recent_failures;
$$;

REVOKE ALL ON FUNCTION public.email_infra_cron_last_run() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.email_infra_cron_last_run() TO authenticated, service_role;