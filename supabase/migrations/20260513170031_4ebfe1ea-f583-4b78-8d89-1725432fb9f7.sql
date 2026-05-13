
-- Alerts table for email infra health monitor
CREATE TABLE IF NOT EXISTS public.email_infra_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_key text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('critical','warning')),
  detail text NOT NULL,
  opened_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
CREATE INDEX IF NOT EXISTS email_infra_alerts_open_idx
  ON public.email_infra_alerts (alert_key) WHERE resolved_at IS NULL;

ALTER TABLE public.email_infra_alerts ENABLE ROW LEVEL SECURITY;
-- Service role only (no policies => anon/authenticated cannot read or write)

-- RPC to read pgmq queue depth without exposing pgmq directly
CREATE OR REPLACE FUNCTION public.email_infra_queue_depth()
RETURNS TABLE(queue_name text, queue_length bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pgmq
AS $$
BEGIN
  RETURN QUERY
  SELECT m.queue_name::text, m.queue_length::bigint
  FROM pgmq.metrics_all() m
  WHERE m.queue_name IN ('auth_emails','transactional_emails');
EXCEPTION WHEN OTHERS THEN
  RETURN;
END;
$$;

REVOKE ALL ON FUNCTION public.email_infra_queue_depth() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.email_infra_queue_depth() TO service_role;
