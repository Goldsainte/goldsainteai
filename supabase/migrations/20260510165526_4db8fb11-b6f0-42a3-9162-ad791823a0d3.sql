
CREATE OR REPLACE FUNCTION public.notify_admins_trip_pending_review(
  _trip_id uuid,
  _trip_title text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _submitter uuid := auth.uid();
  _is_owner boolean;
BEGIN
  IF _submitter IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Only the trip's agent or creator can trigger admin notifications for it
  SELECT EXISTS (
    SELECT 1 FROM public.packaged_trips pt
    WHERE pt.id = _trip_id
      AND (pt.agent_id = _submitter OR pt.creator_id = _submitter)
  ) INTO _is_owner;

  IF NOT _is_owner THEN
    RAISE EXCEPTION 'Not the trip owner';
  END IF;

  INSERT INTO public.notifications (user_id, type, title, message, entity_type, entity_id, is_read)
  SELECT
    ur.user_id,
    'trip_pending_review',
    'New trip awaiting review',
    COALESCE(_trip_title, 'Untitled trip') || ' has been submitted for review.',
    'packaged_trips',
    _trip_id,
    false
  FROM public.user_roles ur
  WHERE ur.role = 'admin';
END;
$$;

GRANT EXECUTE ON FUNCTION public.notify_admins_trip_pending_review(uuid, text) TO authenticated;
