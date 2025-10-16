-- Create notification trigger for verification status changes
CREATE OR REPLACE FUNCTION notify_verification_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only notify on status changes from pending to approved/rejected
  IF OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected') THEN
    INSERT INTO public.notifications (
      user_id,
      notification_type,
      title,
      message,
      metadata,
      link
    ) VALUES (
      NEW.user_id,
      'verification',
      CASE 
        WHEN NEW.status = 'approved' THEN 'Verification Approved ✓'
        ELSE 'Verification Update'
      END,
      CASE 
        WHEN NEW.status = 'approved' THEN 'Your identity verification has been approved! You now have a verified badge.'
        WHEN NEW.status = 'rejected' THEN 'Your verification was not approved. Reason: ' || COALESCE(NEW.rejection_reason, 'Please contact support for details.')
        ELSE 'Your verification status has been updated.'
      END,
      jsonb_build_object(
        'verification_id', NEW.id,
        'verification_type', NEW.verification_type,
        'status', NEW.status
      ),
      '/travel-settings'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_notify_verification_status ON public.customer_verifications;

-- Create trigger
CREATE TRIGGER trigger_notify_verification_status
  AFTER UPDATE ON public.customer_verifications
  FOR EACH ROW
  EXECUTE FUNCTION notify_verification_status_change();