# Admin Alert: Auth Email Failure Monitoring

Add an early-warning system that notifies admins the moment any `auth_emails` row lands in `failed` or `dlq` status in `email_send_log` — so we catch silent fallbacks to default Supabase templates before users complain.

## What gets built

### 1. Database trigger (migration)
- `AFTER INSERT` trigger on `email_send_log`
- Fires only when `template_name = 'auth_emails'` AND `status IN ('failed', 'dlq')`
- Inserts a row into the existing `notifications` table targeted at all users with the `admin` role (looked up via `user_roles` + `has_role`)
- Notification payload includes: recipient email, status, error_message, created_at, message_id

### 2. Admin UI badge (frontend)
- Small alert pill in the admin nav/header showing unread auth-email-failure count
- Click → opens a panel listing recent failures (recipient, error, timestamp, retry status)
- Uses existing real-time notifications channel — no new subscription infra needed
- Visible only to users with `admin` role

### 3. Optional email alert to admins (deferred)
- Not in this plan — Slack/email pings can be added later if the in-app alert proves insufficient

## Technical details

**Migration:**
```sql
CREATE OR REPLACE FUNCTION public.notify_admins_auth_email_failure()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.template_name = 'auth_emails' AND NEW.status IN ('failed','dlq') THEN
    INSERT INTO public.notifications (user_id, type, title, message, metadata)
    SELECT ur.user_id, 'auth_email_failure',
           'Auth email failed: ' || NEW.recipient_email,
           COALESCE(NEW.error_message, 'Delivery failed after retries'),
           jsonb_build_object(
             'message_id', NEW.message_id,
             'recipient', NEW.recipient_email,
             'status', NEW.status,
             'error', NEW.error_message
           )
    FROM public.user_roles ur WHERE ur.role = 'admin';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_notify_admins_auth_email_failure
AFTER INSERT ON public.email_send_log
FOR EACH ROW EXECUTE FUNCTION public.notify_admins_auth_email_failure();
```

**Frontend:**
- New component `AuthEmailFailureAlert.tsx` in admin layout
- Queries `notifications` where `type = 'auth_email_failure'` AND `read = false`
- Subscribes to realtime inserts on same channel
- Detail panel reuses existing notification list patterns

## Out of scope
- No changes to `auth-email-hook`, templates, or queue logic
- No changes to existing notification infrastructure
- No external alerting (Slack, SMS, email-to-admin)
