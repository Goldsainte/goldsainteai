-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create function to expire old marketplace jobs
CREATE OR REPLACE FUNCTION expire_old_marketplace_jobs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.marketplace_jobs
  SET status = 'expired'
  WHERE status = 'open'
    AND expires_at < NOW();
END;
$$;

-- Schedule the function to run every hour
SELECT cron.schedule(
  'expire-marketplace-jobs',
  '0 * * * *',
  $$SELECT expire_old_marketplace_jobs()$$
);