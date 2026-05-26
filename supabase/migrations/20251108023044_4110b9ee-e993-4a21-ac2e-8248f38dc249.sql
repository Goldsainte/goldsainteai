-- Create notifications table
CREATE TABLE IF NOT EXISTS public.trip_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  trip_id UUID NOT NULL REFERENCES public.group_trips(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('new_suggestion', 'high_votes', 'participant_joined', 'message', 'departure_reminder', 'budget_alert')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trip_notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.trip_notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON public.trip_notifications
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON public.trip_notifications
  FOR DELETE
  USING (user_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_trip_notifications_user ON public.trip_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_notifications_trip ON public.trip_notifications(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_notifications_read ON public.trip_notifications(read);
CREATE INDEX IF NOT EXISTS idx_trip_notifications_created ON public.trip_notifications(created_at DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_notifications;

-- Function to create notifications for trip members
CREATE OR REPLACE FUNCTION public.notify_trip_members(
  p_trip_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT NULL,
  p_exclude_user_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.trip_notifications (user_id, trip_id, type, title, message, data)
  SELECT 
    tm.user_id,
    p_trip_id,
    p_type,
    p_title,
    p_message,
    p_data
  FROM public.trip_members tm
  WHERE tm.trip_id = p_trip_id
    AND tm.status = 'accepted'
    AND (p_exclude_user_id IS NULL OR tm.user_id != p_exclude_user_id);
END;
$$;

-- Trigger for new suggestions
CREATE OR REPLACE FUNCTION public.notify_new_suggestion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.notify_trip_members(
    NEW.trip_id,
    'new_suggestion',
    'New Suggestion Added',
    'A new ' || NEW.suggestion_type || ' suggestion "' || NEW.title || '" has been added',
    jsonb_build_object('suggestion_id', NEW.id, 'suggestion_type', NEW.suggestion_type),
    NEW.created_by
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_new_suggestion
  AFTER INSERT ON public.trip_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_suggestion();

-- Trigger for high votes (5+ upvotes)
CREATE OR REPLACE FUNCTION public.notify_high_votes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_upvotes INT;
  v_suggestion RECORD;
BEGIN
  -- Count upvotes for the suggestion
  SELECT COUNT(*) INTO v_upvotes
  FROM public.trip_votes
  WHERE suggestion_id = NEW.suggestion_id AND vote_type = 'upvote';

  -- If exactly 5 upvotes, notify members
  IF v_upvotes = 5 THEN
    SELECT * INTO v_suggestion
    FROM public.trip_suggestions
    WHERE id = NEW.suggestion_id;

    PERFORM public.notify_trip_members(
      v_suggestion.trip_id,
      'high_votes',
      'ðŸ”¥ Popular Suggestion!',
      '"' || v_suggestion.title || '" has reached 5 upvotes!',
      jsonb_build_object('suggestion_id', v_suggestion.id)
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_high_votes
  AFTER INSERT ON public.trip_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_high_votes();

-- Trigger for new participants
CREATE OR REPLACE FUNCTION public.notify_participant_joined()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_suggestion RECORD;
BEGIN
  IF NEW.status = 'confirmed' AND (OLD IS NULL OR OLD.status != 'confirmed') THEN
    SELECT * INTO v_suggestion
    FROM public.trip_suggestions
    WHERE id = NEW.suggestion_id;

    PERFORM public.notify_trip_members(
      NEW.trip_id,
      'participant_joined',
      'Someone Joined an Activity',
      'A member confirmed participation in "' || v_suggestion.title || '"',
      jsonb_build_object('suggestion_id', v_suggestion.id),
      NEW.user_id
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_participant_joined
  AFTER INSERT OR UPDATE ON public.suggestion_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_participant_joined();
