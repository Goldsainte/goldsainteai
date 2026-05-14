-- Speed up email delivery: drop cron to every minute, reduce send delay
DO $$
DECLARE jid bigint;
BEGIN
  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'process-email-queue';
  IF jid IS NOT NULL THEN
    PERFORM cron.alter_job(jid, schedule := '* * * * *');
  END IF;
END $$;

UPDATE public.email_send_state
SET batch_size = 25, send_delay_ms = 100
WHERE id = 1;