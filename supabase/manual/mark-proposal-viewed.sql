-- mark-proposal-viewed.sql
-- ============================================================================
-- RUN THIS IN THE SUPABASE SQL EDITOR (once), and paste this file at
-- supabase/manual/mark-proposal-viewed.sql so the repo tells the truth.
--
-- What it does:
--   1. mark_proposal_viewed(p_proposal_id): lets the TRIP OWNER (and only
--      them) flip a proposal from 'sent' to 'traveler_review' when they
--      first open it. SECURITY DEFINER with its own ownership check — far
--      safer than granting travelers UPDATE rights on proposals.
--   2. Extends notify_proposal_status() so the proposer gets an in-app
--      notification the moment the traveler starts reviewing.
--
-- NOTE while here: the existing accepted/declined branches target
-- NEW.agent_id. If creator proposals carry proposer_id but a NULL agent_id,
-- those notifications go nowhere — VERIFY on Wednesday (JOURNEY-CLARITY
-- board). The new branch below uses COALESCE(proposer_id, agent_id).
--
-- Both statements are idempotent (CREATE OR REPLACE).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.mark_proposal_viewed(p_proposal_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE trip_proposals tp
  SET status = 'traveler_review',
      traveler_reviewed = true
  WHERE tp.id = p_proposal_id
    AND tp.status = 'sent'
    AND EXISTS (
      SELECT 1 FROM trip_requests tr
      WHERE tr.id = tp.trip_request_id
        AND tr.user_id = auth.uid()
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_proposal_viewed(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.notify_proposal_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    INSERT INTO notifications (user_id, type, title, message, action_url, entity_type, entity_id)
    VALUES (NEW.agent_id, 'proposal_accepted', 'Proposal Accepted', 'Your proposal has been accepted!', '/marketplace', 'trip_proposal', NEW.id);
  ELSIF NEW.status = 'declined' AND OLD.status != 'declined' THEN
    INSERT INTO notifications (user_id, type, title, message, action_url, entity_type, entity_id)
    VALUES (NEW.agent_id, 'proposal_declined', 'Proposal Declined', 'Your proposal was not selected this time.', '/marketplace', 'trip_proposal', NEW.id);
  ELSIF NEW.status = 'traveler_review' AND OLD.status = 'sent' THEN
    INSERT INTO notifications (user_id, type, title, message, action_url, entity_type, entity_id)
    VALUES (
      COALESCE(NEW.proposer_id, NEW.agent_id),
      'proposal_viewed',
      'Your proposal is being reviewed',
      'The traveler has opened your proposal and is reviewing it now.',
      '/proposals/' || NEW.id,
      'trip_proposal',
      NEW.id
    );
  END IF;
  RETURN NEW;
END; $$;

-- Verify after running (expect both functions listed):
-- SELECT proname FROM pg_proc WHERE proname IN ('mark_proposal_viewed', 'notify_proposal_status');
