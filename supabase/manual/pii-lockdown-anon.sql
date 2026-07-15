-- =========================================================================
-- PII lockdown, phase 1 (pre-press): block LOGGED-OUT access to contact
-- fields that Lovable's scanner flagged as publicly readable.
-- Run once in the Supabase SQL editor. Safe to re-run (idempotent).
-- Mirror at supabase/manual/pii-lockdown-anon.sql
--
-- Design note: every legitimate reader of these columns is authenticated
-- (invoice generation, admin panels) or server-side (service role, which
-- bypasses this entirely). Anonymous web visitors — including press-day
-- scrapers — have no business reading emails/phones. Column REVOKEs from
-- `anon` therefore reduce real exposure with zero app breakage.
-- Phase 2 (post-launch, scheduled): isolate contact fields behind
-- owner/admin-only access for authenticated users too.
-- =========================================================================

-- 1. suppliers: ZERO references anywhere in the app — a dead table lying
--    open with contact info. Lock it to server-side only.
REVOKE SELECT ON public.suppliers FROM anon, authenticated;

-- 2. travel_agents: public pages read agency_name/license/rating only.
REVOKE SELECT (email, phone, primary_contact_name) ON public.travel_agents FROM anon;

-- 3. marketplace_jobs: open-job visibility must not include organizer
--    contact details. (InvoiceGenerator selects * but runs authenticated.)
REVOKE SELECT (contact_info, group_organizer_email, additional_emails, notify_all_emails)
  ON public.marketplace_jobs FROM anon;

-- 4. newsroom_authors: article pages need name/avatar/bio — never email.
REVOKE SELECT (email) ON public.newsroom_authors FROM anon;

-- Verify (each should error with permission denied when run as anon via
-- the API, but from this editor just confirm the grants):
-- SELECT grantee, privilege_type, column_name FROM information_schema.column_privileges
--  WHERE table_name IN ('travel_agents','marketplace_jobs','newsroom_authors')
--    AND grantee = 'anon' AND column_name IN ('email','phone','contact_info','group_organizer_email');
-- (Expect NO rows for those columns.)
