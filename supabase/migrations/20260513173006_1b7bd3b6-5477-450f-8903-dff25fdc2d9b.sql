-- Admin RPCs to manage email dead-letter queues

CREATE OR REPLACE FUNCTION public.admin_list_email_dlq()
RETURNS TABLE (
  queue_name text,
  msg_id bigint,
  read_ct integer,
  enqueued_at timestamptz,
  message jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pgmq
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'forbidden: admin role required';
  END IF;

  RETURN QUERY
    SELECT 'auth_emails'::text, q.msg_id, q.read_ct, q.enqueued_at, q.message
    FROM pgmq.q_auth_emails_dlq q
    UNION ALL
    SELECT 'transactional_emails'::text, q.msg_id, q.read_ct, q.enqueued_at, q.message
    FROM pgmq.q_transactional_emails_dlq q
    ORDER BY 4 DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_email_dlq() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_email_dlq() TO authenticated;

-- Retry: re-enqueue the original message to its source queue, then archive from DLQ
CREATE OR REPLACE FUNCTION public.admin_retry_email_dlq(
  p_queue_name text,
  p_msg_id bigint
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pgmq
AS $$
DECLARE
  v_dlq_name text;
  v_message jsonb;
  v_new_msg_id bigint;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'forbidden: admin role required';
  END IF;

  IF p_queue_name NOT IN ('auth_emails', 'transactional_emails') THEN
    RAISE EXCEPTION 'invalid queue: %', p_queue_name;
  END IF;

  v_dlq_name := p_queue_name || '_dlq';

  EXECUTE format('SELECT message FROM pgmq.q_%I WHERE msg_id = $1', v_dlq_name)
    INTO v_message USING p_msg_id;

  IF v_message IS NULL THEN
    RAISE EXCEPTION 'dlq message % not found in %', p_msg_id, v_dlq_name;
  END IF;

  v_new_msg_id := pgmq.send(p_queue_name, v_message);
  PERFORM pgmq.archive(v_dlq_name, p_msg_id);

  RETURN v_new_msg_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_retry_email_dlq(text, bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_retry_email_dlq(text, bigint) TO authenticated;

-- Dismiss: archive a DLQ message without retrying
CREATE OR REPLACE FUNCTION public.admin_dismiss_email_dlq(
  p_queue_name text,
  p_msg_id bigint
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pgmq
AS $$
DECLARE
  v_dlq_name text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'forbidden: admin role required';
  END IF;

  IF p_queue_name NOT IN ('auth_emails', 'transactional_emails') THEN
    RAISE EXCEPTION 'invalid queue: %', p_queue_name;
  END IF;

  v_dlq_name := p_queue_name || '_dlq';
  RETURN pgmq.archive(v_dlq_name, p_msg_id);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_dismiss_email_dlq(text, bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_dismiss_email_dlq(text, bigint) TO authenticated;