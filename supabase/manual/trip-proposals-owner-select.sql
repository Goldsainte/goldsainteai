-- =========================================================================
-- Trip owners must be able to SEE the proposals sent to them.
-- Run in the Supabase SQL editor. Mirror at
-- supabase/manual/trip-proposals-owner-select.sql
--
-- SYMPTOM CHAIN (Jul 15): traveler clicks "Review proposal" in the branded
-- email → /proposals/:id → RLS returns nothing → error card → old dead
-- "Go back" path → 404 → homepage. Also explains "clicked the notification
-- and still can't see the bid" (Jul 14).
--
-- STEP 1 — DIAGNOSE FIRST (paste results to Claude):
SELECT policyname, cmd, qual::text
FROM pg_policies
WHERE tablename = 'trip_proposals';
--
-- STEP 2 — THE FIX (safe to run regardless; policies are additive/OR'd,
-- and this is a narrow read-only grant):
DROP POLICY IF EXISTS "Trip owners can view proposals on their requests" ON public.trip_proposals;
CREATE POLICY "Trip owners can view proposals on their requests"
  ON public.trip_proposals FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trip_requests tr
      WHERE tr.id = trip_proposals.trip_request_id
        AND tr.user_id = auth.uid()
    )
  );
--
-- STEP 3 — VERIFY: rerun the STEP 1 query; the new policy should be listed.
-- Then, as the traveler, click the email's Review Proposal button again.
