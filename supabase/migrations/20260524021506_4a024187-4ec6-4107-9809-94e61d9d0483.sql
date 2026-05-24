
-- Fix FKs to auth.users that block user deletion.
-- Owned data -> CASCADE. Reviewer/actor/admin refs -> SET NULL.

-- ===== CASCADE (user-owned records) =====
ALTER TABLE public.agent_applications
  DROP CONSTRAINT IF EXISTS agent_applications_user_id_fkey,
  ADD  CONSTRAINT agent_applications_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.brand_applications
  DROP CONSTRAINT IF EXISTS brand_applications_user_id_fkey,
  ADD  CONSTRAINT brand_applications_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.agent_inquiries
  DROP CONSTRAINT IF EXISTS agent_inquiries_user_id_fkey,
  ADD  CONSTRAINT agent_inquiries_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.activity_logs
  DROP CONSTRAINT IF EXISTS activity_logs_user_id_fkey,
  ADD  CONSTRAINT activity_logs_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.dispute_submissions
  DROP CONSTRAINT IF EXISTS dispute_submissions_user_id_fkey,
  ADD  CONSTRAINT dispute_submissions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.processed_payments
  DROP CONSTRAINT IF EXISTS processed_payments_user_id_fkey,
  ADD  CONSTRAINT processed_payments_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_sender_id_fkey,
  ADD  CONSTRAINT messages_sender_id_fkey
    FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  DROP CONSTRAINT IF EXISTS messages_receiver_id_fkey,
  ADD  CONSTRAINT messages_receiver_id_fkey
    FOREIGN KEY (receiver_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_traveler_id_fkey,
  ADD  CONSTRAINT bookings_traveler_id_fkey
    FOREIGN KEY (traveler_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  DROP CONSTRAINT IF EXISTS bookings_agent_id_fkey,
  ADD  CONSTRAINT bookings_agent_id_fkey
    FOREIGN KEY (agent_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  DROP CONSTRAINT IF EXISTS bookings_creator_id_fkey,
  ADD  CONSTRAINT bookings_creator_id_fkey
    FOREIGN KEY (creator_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  DROP CONSTRAINT IF EXISTS bookings_brand_id_fkey,
  ADD  CONSTRAINT bookings_brand_id_fkey
    FOREIGN KEY (brand_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  DROP CONSTRAINT IF EXISTS bookings_cancelled_by_fkey,
  ADD  CONSTRAINT bookings_cancelled_by_fkey
    FOREIGN KEY (cancelled_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.marketplace_disputes
  DROP CONSTRAINT IF EXISTS marketplace_disputes_raised_by_fkey,
  ADD  CONSTRAINT marketplace_disputes_raised_by_fkey
    FOREIGN KEY (raised_by) REFERENCES auth.users(id) ON DELETE CASCADE,
  DROP CONSTRAINT IF EXISTS marketplace_disputes_resolved_by_fkey,
  ADD  CONSTRAINT marketplace_disputes_resolved_by_fkey
    FOREIGN KEY (resolved_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.marketplace_job_attachments
  DROP CONSTRAINT IF EXISTS marketplace_job_attachments_uploaded_by_fkey,
  ADD  CONSTRAINT marketplace_job_attachments_uploaded_by_fkey
    FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ===== SET NULL (reviewer / actor / admin pointers) =====
ALTER TABLE public.agent_applications
  DROP CONSTRAINT IF EXISTS agent_applications_admin_reviewer_id_fkey,
  ADD  CONSTRAINT agent_applications_admin_reviewer_id_fkey
    FOREIGN KEY (admin_reviewer_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.brand_applications
  DROP CONSTRAINT IF EXISTS brand_applications_admin_reviewer_id_fkey,
  ADD  CONSTRAINT brand_applications_admin_reviewer_id_fkey
    FOREIGN KEY (admin_reviewer_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.application_audit_log
  DROP CONSTRAINT IF EXISTS application_audit_log_actor_id_fkey,
  ADD  CONSTRAINT application_audit_log_actor_id_fkey
    FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.customer_verifications
  DROP CONSTRAINT IF EXISTS customer_verifications_reviewed_by_fkey,
  ADD  CONSTRAINT customer_verifications_reviewed_by_fkey
    FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.booking_milestones
  DROP CONSTRAINT IF EXISTS booking_milestones_released_to_fkey,
  ADD  CONSTRAINT booking_milestones_released_to_fkey
    FOREIGN KEY (released_to) REFERENCES auth.users(id) ON DELETE SET NULL;
