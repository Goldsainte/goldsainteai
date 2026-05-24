CREATE OR REPLACE FUNCTION public.email_infra_count_stuck_pending(_older_than_minutes int DEFAULT 10)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH statuses AS (
    SELECT message_id,
           array_agg(DISTINCT status) AS all_statuses,
           min(created_at) FILTER (WHERE status = 'pending') AS first_pending
    FROM public.email_send_log
    WHERE message_id IS NOT NULL
    GROUP BY message_id
  )
  SELECT count(*)::int
  FROM statuses
  WHERE 'pending' = ANY(all_statuses)
    AND NOT (
      'sent' = ANY(all_statuses)
      OR 'dlq' = ANY(all_statuses)
      OR 'failed' = ANY(all_statuses)
      OR 'suppressed' = ANY(all_statuses)
      OR 'bounced' = ANY(all_statuses)
      OR 'complained' = ANY(all_statuses)
    )
    AND first_pending < (now() - make_interval(mins => _older_than_minutes));
$$;

GRANT EXECUTE ON FUNCTION public.email_infra_count_stuck_pending(int) TO anon, authenticated, service_role;