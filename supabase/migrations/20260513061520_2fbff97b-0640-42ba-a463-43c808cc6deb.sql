-- Track when we sent a debounced email notification for a message
ALTER TABLE public.messages 
  ADD COLUMN IF NOT EXISTS notification_email_sent_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_messages_notification_pending
  ON public.messages (created_at)
  WHERE is_read = false AND notification_email_sent_at IS NULL;

-- Schedule the debounced message-email dispatcher to run every minute
DO $$
DECLARE
  service_key text;
  project_ref text := 'iwdevxltjuedijrcdejs';
BEGIN
  -- Reuse the same vault secret that the email queue uses
  SELECT decrypted_secret INTO service_key
  FROM vault.decrypted_secrets
  WHERE name = 'email_queue_service_role_key'
  LIMIT 1;

  IF service_key IS NULL THEN
    RAISE NOTICE 'email_queue_service_role_key not found in vault — skipping cron job creation';
    RETURN;
  END IF;

  -- Remove existing job if present
  PERFORM cron.unschedule(jobid)
  FROM cron.job WHERE jobname = 'dispatch-message-email';

  PERFORM cron.schedule(
    'dispatch-message-email',
    '* * * * *',
    format(
      $cron$
      SELECT net.http_post(
        url := 'https://%s.supabase.co/functions/v1/dispatch-message-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer %s'
        ),
        body := '{}'::jsonb
      ) AS request_id;
      $cron$,
      project_ref, service_key
    )
  );
END $$;