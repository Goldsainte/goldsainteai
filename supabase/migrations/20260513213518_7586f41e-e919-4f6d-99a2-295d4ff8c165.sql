-- 1. Add booking link to affiliate_commissions for refund reversal
ALTER TABLE public.affiliate_commissions
  ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_booking
  ON public.affiliate_commissions(booking_id) WHERE booking_id IS NOT NULL;

-- 2. RPC to reject affiliate commissions tied to a refunded booking
CREATE OR REPLACE FUNCTION public.reject_booking_affiliate_commissions(target_booking_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected INTEGER := 0;
BEGIN
  UPDATE public.affiliate_commissions
  SET status = 'rejected',
      updated_at = now()
  WHERE booking_id = target_booking_id
    AND status IN ('pending', 'approved');

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reject_booking_affiliate_commissions(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reject_booking_affiliate_commissions(UUID) TO service_role;

-- 3. Schedule daily cleanup of old webhook_events (>30 days)
DO $blk$
DECLARE
  existing_job INTEGER;
BEGIN
  SELECT jobid INTO existing_job FROM cron.job WHERE jobname = 'cleanup-webhook-events';
  IF existing_job IS NOT NULL THEN
    PERFORM cron.unschedule(existing_job);
  END IF;

  PERFORM cron.schedule(
    'cleanup-webhook-events',
    '0 3 * * *',
    $cron$
    DELETE FROM public.webhook_events
    WHERE created_at < now() - INTERVAL '30 days';
    $cron$
  );
END $blk$;