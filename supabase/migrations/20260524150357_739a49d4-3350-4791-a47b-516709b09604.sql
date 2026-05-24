
CREATE OR REPLACE FUNCTION public.notify_admins_auth_email_failure()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.template_name = 'auth_emails' AND NEW.status IN ('failed', 'dlq') THEN
    INSERT INTO public.notifications (
      user_id, type, title, message, priority,
      entity_type, action_url, action_label
    )
    SELECT
      ur.user_id,
      'auth_email_failure',
      'Auth email ' || NEW.status || ': ' || COALESCE(NEW.recipient_email, 'unknown'),
      COALESCE(NEW.error_message, 'Delivery failed after retries. Default Supabase template may have been used as fallback.'),
      'high',
      'email_send_log',
      '/admin/email-dlq',
      'Review failures'
    FROM public.user_roles ur
    WHERE ur.role = 'admin';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admins_auth_email_failure ON public.email_send_log;

CREATE TRIGGER trg_notify_admins_auth_email_failure
AFTER INSERT ON public.email_send_log
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_auth_email_failure();
