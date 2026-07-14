-- archive-rehearsal-trip.sql
-- ============================================================================
-- RUN ON WEDNESDAY JUL 15 ONLY — launch-morning step 5.
--
-- Do NOT run this until AFTER:
--   1. Deposit released (~$0.97) and Tommy confirmed trip complete (~$2.89)
--   2. The launch-gate query shows TWO rows with TWO tr_ transfer ids:
--        SELECT trip_booking_id, milestone, payout_amount, platform_fee,
--               stripe_transfer_id
--        FROM trip_payouts ORDER BY created_at DESC LIMIT 5;
--
-- This hides the $4 LAUNCH REHEARSAL trip from the live marketplace before
-- doors open. Archiving it earlier could interfere with the release flow.
--
-- Trip: LAUNCH REHEARSAL / 50d45682-238a-4f1c-b399-ca50599477a6
-- Safe to re-run: archiving an already-archived trip changes nothing.
-- ============================================================================

UPDATE packaged_trips
SET status = 'archived',
    updated_at = now()
WHERE id = '50d45682-238a-4f1c-b399-ca50599477a6';

-- Verify (status should read 'archived'):
-- SELECT id, title, status, updated_at
-- FROM packaged_trips
-- WHERE id = '50d45682-238a-4f1c-b399-ca50599477a6';
