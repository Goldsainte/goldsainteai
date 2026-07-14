-- rehearsal-final-anchor-rescue.sql
-- ============================================================================
-- RECORD OF SQL ALREADY RUN — Mon Jul 13, 2026 (rehearsal booking).
-- You do NOT need to run this again. It is mirrored here so the repo tells
-- the truth about every manual change made to production.
--
-- Why it was needed:
--   The webhook's payment-intent tracking (stripe-webhook-handler, shipped
--   Mon ~17:17) records each payment's PI id into
--   trip_bookings.metadata.payment_intents so release-trip-deposit can
--   anchor Stripe transfers to a settled charge (source_transaction).
--   The rehearsal booking's BALANCE payment ($3.11) happened BEFORE that
--   tracking existed, so its PI was missing. This backfills it.
--
-- Booking: GS-B219CE4E / b219ce4e-2d3a-400b-a44f-413d733b868b
-- Balance payment intent: pi_3TsrtyF9Y0dnmu4Y2S6BD8dy
--
-- Safe to re-run: the WHERE clause skips the update if the PI is already
-- present, so running it twice cannot double-append.
-- ============================================================================

UPDATE trip_bookings
SET metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{payment_intents}',
      COALESCE(metadata->'payment_intents', '[]'::jsonb)
        || '["pi_3TsrtyF9Y0dnmu4Y2S6BD8dy"]'::jsonb
    ),
    updated_at = now()
WHERE id = 'b219ce4e-2d3a-400b-a44f-413d733b868b'
  AND NOT (
    COALESCE(metadata->'payment_intents', '[]'::jsonb)
      ? 'pi_3TsrtyF9Y0dnmu4Y2S6BD8dy'
  );

-- Verify (should show the PI in the array):
-- SELECT id, booking_reference, metadata->'payment_intents' AS payment_intents
-- FROM trip_bookings
-- WHERE id = 'b219ce4e-2d3a-400b-a44f-413d733b868b';
