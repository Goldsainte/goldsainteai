-- Create post_collaborators table for collaborative posts
CREATE TABLE IF NOT EXISTS public.post_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.travel_posts(id) ON DELETE CASCADE,
  collaborator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, collaborator_id)
);

-- Enable RLS
ALTER TABLE public.post_collaborators ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view collaborations on posts they can see"
  ON public.post_collaborators FOR SELECT
  USING (
    post_id IN (SELECT id FROM public.travel_posts) OR
    collaborator_id = auth.uid() OR
    invited_by = auth.uid()
  );

CREATE POLICY "Post owners can invite collaborators"
  ON public.post_collaborators FOR INSERT
  WITH CHECK (
    invited_by = auth.uid() AND
    post_id IN (SELECT id FROM public.travel_posts WHERE user_id = auth.uid())
  );

CREATE POLICY "Collaborators can update their invitation status"
  ON public.post_collaborators FOR UPDATE
  USING (collaborator_id = auth.uid());

CREATE POLICY "Post owners can delete collaboration invites"
  ON public.post_collaborators FOR DELETE
  USING (
    invited_by = auth.uid() OR
    post_id IN (SELECT id FROM public.travel_posts WHERE user_id = auth.uid())
  );

-- CREATE INDEX IF NOT EXISTS for performance
CREATE INDEX IF NOT EXISTS idx_post_collaborators_post_id ON public.post_collaborators(post_id);
CREATE INDEX IF NOT EXISTS idx_post_collaborators_collaborator_id ON public.post_collaborators(collaborator_id);

-- Notification trigger for collaboration invites
CREATE OR REPLACE FUNCTION public.notify_collaboration_invite()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inviter_username TEXT;
BEGIN
  -- Get inviter username
  SELECT username INTO inviter_username
  FROM profiles
  WHERE id = NEW.invited_by;
  
  -- Create notification
  INSERT INTO notifications (
    user_id,
    notification_type,
    title,
    message,
    metadata,
    link
  )
  VALUES (
    NEW.collaborator_id,
    'collaboration_invite',
    'Collaboration Request',
    COALESCE(inviter_username, 'Someone') || ' invited you to collaborate on a post',
    jsonb_build_object('post_id', NEW.post_id, 'invite_id', NEW.id, 'inviter_id', NEW.invited_by),
    '/travel-feed'
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_collaboration_invite
  AFTER INSERT ON public.post_collaborators
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION public.notify_collaboration_invite();

-- Notification trigger for accepted collaborations
CREATE OR REPLACE FUNCTION public.notify_collaboration_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  collaborator_username TEXT;
BEGIN
  -- Only notify on status change to accepted
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Get collaborator username
    SELECT username INTO collaborator_username
    FROM profiles
    WHERE id = NEW.collaborator_id;
    
    -- Notify the inviter
    INSERT INTO notifications (
      user_id,
      notification_type,
      title,
      message,
      metadata,
      link
    )
    VALUES (
      NEW.invited_by,
      'collaboration_accepted',
      'Collaboration Accepted',
      COALESCE(collaborator_username, 'Someone') || ' accepted your collaboration invite',
      jsonb_build_object('post_id', NEW.post_id, 'collaborator_id', NEW.collaborator_id),
      '/travel-feed'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_collaboration_accepted
  AFTER UPDATE ON public.post_collaborators
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_collaboration_accepted();
