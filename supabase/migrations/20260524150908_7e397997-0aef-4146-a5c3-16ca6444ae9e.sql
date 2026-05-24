
CREATE OR REPLACE FUNCTION public.notify_admins_auth_email_failure()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, vault
AS $$
DECLARE
  service_key text;
  fn_url text := 'https://iwdevxltjuedijrcdejs.supabase.co/functions/v1/send-transactional-email';
  admin_rec record;
BEGIN
  IF NEW.template_name = 'auth_emails' AND NEW.status IN ('failed', 'dlq') THEN
    -- 1. In-app notification (existing behavior)
    INSERT INTO public.notifications (
      user_id, type, title, message, priority,
      entity_type, action_url, action_label
    )
    SELECT
      ur.user_id,
      'auth_email_failure',
      'Auth email ' || NEW.status || ': ' || COALESCE(NEW.recipient_email, 'unknown'),
      COALESCE(NEW.error_message, 'Delivery failed after retries.'),
      'high',
      'email_send_log',
      '/admin/email-dlq',
      'Review failures'
    FROM public.user_roles ur
    WHERE ur.role = 'admin';

    -- 2. Branded admin email
    BEGIN
      SELECT decrypted_secret INTO service_key
      FROM vault.decrypted_secrets
      WHERE name = 'email_queue_service_role_key'
      LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
      service_key := NULL;
    END;

    IF service_key IS NULL THEN
      RAISE WARNING 'email_queue_service_role_key not in vault; skipping admin failure email';
      RETURN NEW;
    END IF;

    FOR admin_rec IN
      SELECT p.email, ur.user_id
      FROM public.user_roles ur
      JOIN public.profiles p ON p.id = ur.user_id
      WHERE ur.role = 'admin' AND p.email IS NOT NULL
    LOOP
      PERFORM net.http_post(
        url := fn_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_key
        ),
        body := jsonb_build_object(
          'templateName', 'admin-auth-email-failure',
          'recipientEmail', admin_rec.email,
          'idempotencyKey', 'auth-fail-' || COALESCE(NEW.message_id, NEW.id::text) || '-' || admin_rec.user_id::text,
          'templateData', jsonb_build_object(
            'recipientEmail', NEW.recipient_email,
            'status', NEW.status,
            'errorMessage', NEW.error_message,
            'messageId', NEW.message_id,
            'occurredAt', to_char(NEW.created_at, 'YYYY-MM-DD HH24:MI "UTC"')
          )
        )
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;
