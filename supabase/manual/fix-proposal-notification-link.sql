-- =========================================================================
-- Fix the dead-end proposal notification
-- Run once in the Supabase SQL editor. Safe to re-run (idempotent).
-- Mirror this file at supabase/manual/fix-proposal-notification-link.sql
--
-- BUG: the notify_new_proposal trigger (fires on every proposal insert)
-- created a bell notification with action_url = '/marketplace' — the bare
-- marketplace page. Travelers clicked it and landed nowhere near the bid.
-- FIX: link straight to the proposal itself (/proposals/<id>), where the
-- traveler can read it, message the specialist, and accept.
-- ALSO: the old function looked up the sender's name ONLY in travel_agents
-- (NEW.agent_id) — creator proposals showed "An expert". Now it falls back
-- to the proposer's profile name, so "Tommy sent a proposal" reads right.
-- =========================================================================

CREATE OR REPLACE FUNCTION public.notify_new_proposal()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE trip_owner_id UUID; sender_name TEXT;
BEGIN
  SELECT user_id INTO trip_owner_id FROM trip_requests WHERE id = NEW.trip_request_id;
  IF trip_owner_id IS NULL THEN RETURN NEW; END IF;

  -- Agent name if this is an agent proposal; otherwise the proposer's profile name.
  SELECT agency_name INTO sender_name FROM travel_agents WHERE user_id = NEW.agent_id;
  IF sender_name IS NULL AND NEW.proposer_id IS NOT NULL THEN
    SELECT COALESCE(display_name, full_name, first_name) INTO sender_name
    FROM profiles WHERE id = NEW.proposer_id;
  END IF;

  INSERT INTO notifications (user_id, type, title, message, action_url, entity_type, entity_id)
  VALUES (
    trip_owner_id,
    'new_proposal',
    'New Proposal Received',
    COALESCE(sender_name, 'A specialist') || ' sent a proposal for your trip request',
    '/proposals/' || NEW.id,
    'trip_proposal',
    NEW.id
  );
  RETURN NEW;
END; $$;

-- Verify (run after): the function body should contain '/proposals/':
-- SELECT prosrc LIKE '%/proposals/%' AS fixed FROM pg_proc WHERE proname = 'notify_new_proposal';
