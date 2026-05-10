## Booking & Payment Flow Rebuild

A coordinated change across the database, Stripe edge functions, messaging, and dashboards. Implementation will follow this order so each step compiles against the previous one.

### 1. Database migration (run first)
- `ALTER TABLE public.trip_bookings ALTER COLUMN partner_id DROP NOT NULL;`
- Add columns if missing: `deposit_amount bigint`, `deposit_percentage numeric`, `platform_commission bigint`. (Will inspect schema first; only add what's missing.)
- No RLS changes required — existing policies already cover these columns.

### 2. `TripBookingSidebar.tsx` deposit fix
- Compute `depositAmount = round(pricePerPerson * depositPercentage / 100)` and `amountCents = depositAmount * 100`.
- Insert: `deposit_amount`, `total_price: pricePerPerson`, `deposit_percentage`, `status: 'deposit_pending'`, allow `partner_id: null` for platform-curated trips.
- Pass `amountCents` (deposit only) into `trip-checkout-create`.

### 3. `trip-checkout-create` — Stripe manual capture
- Add `payment_intent_data: { capture_method: 'manual', metadata: { trip_booking_id, trip_request_id, type: 'trip_booking' } }`.
- Keep existing CORS lock to `https://goldsainte.ai`.

### 4. New edge function `release-trip-deposit`
- Auth: caller must be admin (via `has_role`) or the booking's `partner_id`.
- Loads booking → captures `paymentIntents.capture(stripe_payment_intent_id)`.
- Computes `partner_payout = total_price * 0.85`, `platform_commission = total_price * 0.15`.
- If partner has `stripe_account_id`, creates a `stripe.transfers.create` for the payout.
- Updates booking: `status = 'completed'`, `partner_payout`, `platform_commission`, `payout_paid_at`.
- Adds `supabase/config.toml` block with `verify_jwt = false` (we validate JWT in code, matching project pattern).

### 5. Messaging — agent proposal flow
- `DirectMessageInbox` (or thread component): add "Send a Proposal" button visible only when current user is an agent and the thread is tied to a trip inquiry.
- Inline form: total price, deposit % (default 25), note.
- Persists into `direct_messages` with `message_type: 'proposal'` and `metadata: { price, depositPercentage, note }`.
- Traveler-side renderer: `ProposalMessageCard` showing price + computed deposit + "Accept and Pay Deposit" button → creates `trip_bookings` row at proposed price (status `deposit_pending`) and invokes `trip-checkout-create` with the deposit cents.
- Will inspect `direct_messages` schema first; if `message_type`/`metadata` columns don't exist, add via migration in Step 1.

### 6 + 7. `stripe-webhook-handler` — notification + email
- After `trip_bookings` is set to `confirmed`:
  - Fetch `partner_id`, `traveler_id`, `total_price`, `currency`.
  - Insert into `notifications` for `partner_id` (if present) with type `booking_confirmed`.
  - Look up traveler email via `auth.admin.getUserById(traveler_id)`, then `functions.invoke('send-email', …)` with templateId `booking_confirmation`.
- Will verify `send-email` function exists; if it's named differently (e.g. `send-transactional-email`), I'll wire to the actual one.

### 8. Agent dashboard — Release Deposit button
- On each booking card where `status === 'confirmed'`, render "Release Deposit" button.
- Click → `supabase.functions.invoke('release-trip-deposit', { body: { tripBookingId } })` → optimistic status update + toast.
- Will place this in `PartnerBookingsPage.tsx` (the existing partner bookings list) since `AgentDashboard.tsx` may not be the canonical bookings view; I'll confirm by inspecting both.

### Order of operations
1. Inspect schemas: `trip_bookings`, `direct_messages`, `profiles.stripe_account_id`, `notifications`. Inspect `stripe-webhook-handler` and `send-email` functions.
2. Migration (partner_id nullable + any missing columns).
3. Edge functions: `trip-checkout-create` patch, new `release-trip-deposit`, webhook updates.
4. Frontend: `TripBookingSidebar`, messaging proposal flow, partner bookings "Release Deposit".
5. Deploy edge functions; smoke test via curl where possible.

### Risks / things I'll confirm during implementation
- Whether `direct_messages.message_type` / `metadata` columns exist (may need migration).
- Whether `notifications` table schema matches the insert shape (`type`, `read`, `metadata`).
- Whether `send-email` exists vs `send-transactional-email`.
- Whether agent profiles already have `stripe_account_id` (per Stripe Connect memory, yes).

If any of these diverge significantly from the plan, I'll adapt minimally and note it in the final summary rather than re-planning.
