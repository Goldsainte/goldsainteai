
-- Migration 1: Drop the restrictive CHECK constraint on notifications.type
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE rel.relname = 'notifications'
    AND nsp.nspname = 'public'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) ILIKE '%type%';
  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.notifications DROP CONSTRAINT ' || quote_ident(constraint_name);
  END IF;
END $$;

-- Migration 2: Rewrite ALL trigger functions with correct column names

CREATE OR REPLACE FUNCTION public.notify_new_like()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE post_owner_id UUID; liker_username TEXT;
BEGIN
  SELECT user_id INTO post_owner_id FROM travel_posts WHERE id = NEW.post_id;
  IF post_owner_id = NEW.user_id THEN RETURN NEW; END IF;
  SELECT username INTO liker_username FROM profiles WHERE id = NEW.user_id;
  INSERT INTO notifications (user_id, type, title, message, action_url, entity_type, entity_id)
  VALUES (post_owner_id, 'like', 'New Like', COALESCE(liker_username, 'Someone') || ' liked your post', '/travel-feed', 'post', NEW.post_id);
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_new_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE post_owner_id UUID; commenter_username TEXT;
BEGIN
  SELECT user_id INTO post_owner_id FROM travel_posts WHERE id = NEW.post_id;
  IF post_owner_id = NEW.user_id THEN RETURN NEW; END IF;
  SELECT username INTO commenter_username FROM profiles WHERE id = NEW.user_id;
  INSERT INTO notifications (user_id, type, title, message, action_url, entity_type, entity_id)
  VALUES (post_owner_id, 'comment', 'New Comment', COALESCE(commenter_username, 'Someone') || ' commented on your post', '/travel-feed', 'post', NEW.post_id);
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_new_follow()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE follower_username TEXT;
BEGIN
  SELECT username INTO follower_username FROM profiles WHERE id = NEW.follower_id;
  INSERT INTO notifications (user_id, type, title, message, action_url, entity_type, entity_id)
  VALUES (NEW.following_id, 'follow', 'New Follower', COALESCE(follower_username, 'Someone') || ' started following you', '/travel-profile', 'user', NEW.follower_id);
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_user_tag()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE post_owner_id UUID; tagger_username TEXT;
BEGIN
  SELECT user_id INTO post_owner_id FROM travel_posts WHERE id = NEW.post_id;
  IF NEW.tagged_user_id = post_owner_id THEN RETURN NEW; END IF;
  SELECT username INTO tagger_username FROM profiles WHERE id = post_owner_id;
  INSERT INTO notifications (user_id, type, title, message, action_url, entity_type, entity_id)
  VALUES (NEW.tagged_user_id, 'tag', 'You were tagged', COALESCE(tagger_username, 'Someone') || ' tagged you in a post', '/travel-feed', 'post', NEW.post_id);
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_new_partnership_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE creator_username TEXT;
BEGIN
  SELECT username INTO creator_username FROM profiles WHERE id = NEW.creator_id;
  INSERT INTO notifications (user_id, type, title, message, action_url, entity_type, entity_id)
  VALUES (NEW.brand_id, 'partnership_request', 'New Partnership Request', COALESCE(creator_username, 'A creator') || ' wants to tag you in a paid partnership', '/travel-feed', 'paid_partnership', NEW.id);
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_partnership_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE brand_username TEXT;
BEGIN
  SELECT username INTO brand_username FROM profiles WHERE id = NEW.brand_id;
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    INSERT INTO notifications (user_id, type, title, message, action_url, entity_type, entity_id)
    VALUES (NEW.creator_id, 'partnership_approved', 'Partnership Approved', COALESCE(brand_username, 'A brand') || ' approved your partnership request', '/travel-feed', 'paid_partnership', NEW.id);
  ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
    INSERT INTO notifications (user_id, type, title, message, action_url, entity_type, entity_id)
    VALUES (NEW.creator_id, 'partnership_rejected', 'Partnership Declined', COALESCE(brand_username, 'A brand') || ' declined your partnership request', '/travel-feed', 'paid_partnership', NEW.id);
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_moment_interaction()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE moment_owner_id UUID; responder_username TEXT; interaction_display TEXT;
BEGIN
  SELECT user_id INTO moment_owner_id FROM moments WHERE id = NEW.moment_id;
  IF moment_owner_id = NEW.user_id THEN RETURN NEW; END IF;
  SELECT username INTO responder_username FROM profiles WHERE id = NEW.user_id;
  interaction_display := CASE
    WHEN NEW.interaction_type = 'poll' THEN 'voted on your poll'
    WHEN NEW.interaction_type = 'question' THEN 'answered your question'
    WHEN NEW.interaction_type = 'quiz' THEN 'took your quiz'
    WHEN NEW.interaction_type = 'slider' THEN 'rated your story'
    ELSE 'interacted with your story'
  END;
  INSERT INTO notifications (user_id, type, title, message, action_url, entity_type, entity_id)
  VALUES (moment_owner_id, 'moment_interaction', 'New Story Interaction', COALESCE(responder_username, 'Someone') || ' ' || interaction_display, '/travel-feed', 'moment', NEW.moment_id);
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_direct_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE recipient_id UUID; sender_username TEXT;
BEGIN
  SELECT CASE WHEN customer_id = NEW.sender_id THEN (SELECT user_id FROM travel_agents WHERE id = agent_id) ELSE customer_id END
  INTO recipient_id FROM user_conversations WHERE id = NEW.conversation_id;
  IF recipient_id IS NULL THEN RETURN NEW; END IF;
  SELECT username INTO sender_username FROM profiles WHERE id = NEW.sender_id;
  INSERT INTO notifications (user_id, type, title, message, action_url, entity_type, entity_id)
  VALUES (recipient_id, 'message_received', 'New Message', COALESCE(sender_username, 'Someone') || ' sent you a message', '/messages', 'conversation', NEW.conversation_id);
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_verification_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected') THEN
    INSERT INTO notifications (user_id, type, title, message, action_url, entity_type, entity_id)
    VALUES (NEW.user_id, 'verification',
      CASE WHEN NEW.status = 'approved' THEN 'Verification Approved ✓' ELSE 'Verification Update' END,
      CASE WHEN NEW.status = 'approved' THEN 'Your identity verification has been approved!'
           WHEN NEW.status = 'rejected' THEN 'Your verification was not approved. Reason: ' || COALESCE(NEW.rejection_reason, 'Please contact support.')
           ELSE 'Your verification status has been updated.' END,
      '/travel-settings', 'verification', NEW.id);
  END IF;
  RETURN NEW;
END; $$;

-- Fix tier upgrade function to use correct columns
CREATE OR REPLACE FUNCTION public.evaluate_and_upgrade_creator_tier(p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_metrics RECORD; v_current_tier TEXT; v_eligible_tier TEXT; v_max_tier_level INTEGER := 0;
BEGIN
  PERFORM public.calculate_creator_tier_progress(p_user_id);
  SELECT * INTO v_metrics FROM public.tier_progress_metrics WHERE user_id = p_user_id;
  IF v_metrics IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'No metrics found'); END IF;
  SELECT current_tier INTO v_current_tier FROM public.creator_tier_memberships WHERE user_id = p_user_id;
  SELECT tier_name, tier_level INTO v_eligible_tier, v_max_tier_level FROM public.creator_tiers
  WHERE v_metrics.current_followers >= min_followers AND v_metrics.current_posts >= min_posts
    AND v_metrics.current_engagement_rate >= min_engagement_rate AND v_metrics.monthly_earnings >= min_monthly_earnings
  ORDER BY tier_level DESC LIMIT 1;
  IF v_current_tier IS NULL THEN
    INSERT INTO public.creator_tier_memberships (user_id, current_tier, tier_since) VALUES (p_user_id, COALESCE(v_eligible_tier, 'bronze'), now());
    INSERT INTO public.tier_upgrade_history (user_id, from_tier, to_tier, upgrade_type, reason, metrics_snapshot) VALUES (p_user_id, 'none', COALESCE(v_eligible_tier, 'bronze'), 'automatic', 'Initial tier assignment', row_to_json(v_metrics)::jsonb);
    RETURN jsonb_build_object('success', true, 'tier_changed', true, 'new_tier', COALESCE(v_eligible_tier, 'bronze'), 'previous_tier', null);
  END IF;
  IF v_eligible_tier IS NOT NULL AND v_eligible_tier != v_current_tier THEN
    DECLARE v_current_level INTEGER;
    BEGIN
      SELECT tier_level INTO v_current_level FROM public.creator_tiers WHERE tier_name = v_current_tier;
      IF v_max_tier_level > v_current_level THEN
        UPDATE public.creator_tier_memberships SET previous_tier = current_tier, current_tier = v_eligible_tier, tier_since = now(), updated_at = now() WHERE user_id = p_user_id;
        INSERT INTO public.tier_upgrade_history (user_id, from_tier, to_tier, upgrade_type, reason, metrics_snapshot) VALUES (p_user_id, v_current_tier, v_eligible_tier, 'automatic', 'Metrics threshold reached', row_to_json(v_metrics)::jsonb);
        INSERT INTO public.notifications (user_id, type, title, message, entity_type, entity_id)
        VALUES (p_user_id, 'tier_upgrade', 'Creator Tier Upgraded!', 'Congratulations! You''ve been upgraded to ' || v_eligible_tier || ' tier', 'tier', p_user_id);
        RETURN jsonb_build_object('success', true, 'tier_changed', true, 'new_tier', v_eligible_tier, 'previous_tier', v_current_tier);
      END IF;
    END;
  END IF;
  RETURN jsonb_build_object('success', true, 'tier_changed', false, 'current_tier', v_current_tier);
END; $$;

-- Migration 3: New trigger functions for proposals
CREATE OR REPLACE FUNCTION public.notify_new_proposal()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE trip_owner_id UUID; agent_name TEXT;
BEGIN
  SELECT user_id INTO trip_owner_id FROM trip_requests WHERE id = NEW.trip_request_id;
  IF trip_owner_id IS NULL THEN RETURN NEW; END IF;
  SELECT agency_name INTO agent_name FROM travel_agents WHERE user_id = NEW.agent_id;
  INSERT INTO notifications (user_id, type, title, message, action_url, entity_type, entity_id)
  VALUES (trip_owner_id, 'new_proposal', 'New Proposal Received', COALESCE(agent_name, 'An expert') || ' sent a proposal for your trip request', '/marketplace', 'trip_proposal', NEW.id);
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_proposal_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    INSERT INTO notifications (user_id, type, title, message, action_url, entity_type, entity_id)
    VALUES (NEW.agent_id, 'proposal_accepted', 'Proposal Accepted', 'Your proposal has been accepted!', '/marketplace', 'trip_proposal', NEW.id);
  ELSIF NEW.status = 'declined' AND OLD.status != 'declined' THEN
    INSERT INTO notifications (user_id, type, title, message, action_url, entity_type, entity_id)
    VALUES (NEW.agent_id, 'proposal_declined', 'Proposal Declined', 'Your proposal was not selected this time.', '/marketplace', 'trip_proposal', NEW.id);
  END IF;
  RETURN NEW;
END; $$;

-- Migration 4: Drop ALL existing notification triggers and recreate cleanly
DROP TRIGGER IF EXISTS trg_post_likes_notify ON public.post_likes;
DROP TRIGGER IF EXISTS trigger_notify_new_like ON public.post_likes;
DROP TRIGGER IF EXISTS trg_post_comments_notify ON public.post_comments;
DROP TRIGGER IF EXISTS trigger_notify_new_comment ON public.post_comments;
DROP TRIGGER IF EXISTS trg_user_follows_notify ON public.user_follows;
DROP TRIGGER IF EXISTS trigger_notify_new_follow ON public.user_follows;
DROP TRIGGER IF EXISTS trg_post_user_tags_notify ON public.post_user_tags;
DROP TRIGGER IF EXISTS trigger_notify_user_tag ON public.post_user_tags;
DROP TRIGGER IF EXISTS trg_partnership_request ON public.paid_partnerships;
DROP TRIGGER IF EXISTS trigger_notify_partnership_request ON public.paid_partnerships;
DROP TRIGGER IF EXISTS trg_partnership_status ON public.paid_partnerships;
DROP TRIGGER IF EXISTS trigger_notify_partnership_status ON public.paid_partnerships;
DROP TRIGGER IF EXISTS trg_moment_interaction_notify ON public.moment_interaction_responses;
DROP TRIGGER IF EXISTS trigger_notify_moment_interaction ON public.moment_interaction_responses;
DROP TRIGGER IF EXISTS trg_direct_message_notify ON public.conversation_messages;
DROP TRIGGER IF EXISTS trigger_notify_direct_message ON public.conversation_messages;
DROP TRIGGER IF EXISTS trg_verification_status ON public.customer_verifications;
DROP TRIGGER IF EXISTS trigger_notify_verification_status ON public.customer_verifications;
DROP TRIGGER IF EXISTS trg_proposal_notify ON public.trip_proposals;
DROP TRIGGER IF EXISTS trg_proposal_status_notify ON public.trip_proposals;
DROP TRIGGER IF EXISTS trg_notify_like ON public.post_likes;
DROP TRIGGER IF EXISTS trg_notify_comment ON public.post_comments;
DROP TRIGGER IF EXISTS trg_notify_follow ON public.user_follows;
DROP TRIGGER IF EXISTS trg_notify_tag ON public.post_user_tags;
DROP TRIGGER IF EXISTS trg_notify_partnership_req ON public.paid_partnerships;
DROP TRIGGER IF EXISTS trg_notify_partnership_status ON public.paid_partnerships;
DROP TRIGGER IF EXISTS trg_notify_moment_interaction ON public.moment_interaction_responses;
DROP TRIGGER IF EXISTS trg_notify_dm ON public.conversation_messages;
DROP TRIGGER IF EXISTS trg_notify_verification ON public.customer_verifications;
DROP TRIGGER IF EXISTS trg_notify_new_proposal ON public.trip_proposals;
DROP TRIGGER IF EXISTS trg_notify_proposal_status ON public.trip_proposals;

-- Recreate one trigger per event
CREATE TRIGGER trg_notify_like AFTER INSERT ON public.post_likes FOR EACH ROW EXECUTE FUNCTION public.notify_new_like();
CREATE TRIGGER trg_notify_comment AFTER INSERT ON public.post_comments FOR EACH ROW EXECUTE FUNCTION public.notify_new_comment();
CREATE TRIGGER trg_notify_follow AFTER INSERT ON public.user_follows FOR EACH ROW EXECUTE FUNCTION public.notify_new_follow();
CREATE TRIGGER trg_notify_tag AFTER INSERT ON public.post_user_tags FOR EACH ROW EXECUTE FUNCTION public.notify_user_tag();
CREATE TRIGGER trg_notify_partnership_req AFTER INSERT ON public.paid_partnerships FOR EACH ROW EXECUTE FUNCTION public.notify_new_partnership_request();
CREATE TRIGGER trg_notify_partnership_status AFTER UPDATE ON public.paid_partnerships FOR EACH ROW EXECUTE FUNCTION public.notify_partnership_status();
CREATE TRIGGER trg_notify_moment_interaction AFTER INSERT ON public.moment_interaction_responses FOR EACH ROW EXECUTE FUNCTION public.notify_moment_interaction();
CREATE TRIGGER trg_notify_dm AFTER INSERT ON public.conversation_messages FOR EACH ROW EXECUTE FUNCTION public.notify_direct_message();
CREATE TRIGGER trg_notify_verification AFTER UPDATE ON public.customer_verifications FOR EACH ROW EXECUTE FUNCTION public.notify_verification_status_change();
CREATE TRIGGER trg_notify_new_proposal AFTER INSERT ON public.trip_proposals FOR EACH ROW EXECUTE FUNCTION public.notify_new_proposal();
CREATE TRIGGER trg_notify_proposal_status AFTER UPDATE ON public.trip_proposals FOR EACH ROW EXECUTE FUNCTION public.notify_proposal_status();
