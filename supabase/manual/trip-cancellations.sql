-- ============================================================================
-- trip_cancellations — cancellation requests on the LIVE booking river
-- ============================================================================
-- Created Jul 10/11 weekend. The old cancellation subsystem
-- (booking_cancellations + its three edge functions) is wired entirely to the
-- dead legacy `bookings` table and is being retired. This table keys to
-- trip_bookings, the canonical money table (dollars, not cents).
--
-- Money philosophy (matches Release): approving a request cancels the trip
-- and records the refund DECISION. The refund itself is issued manually in
-- the Stripe dashboard, then recorded here via the explicit "Mark refunded"
-- action in /admin/cancellations. No automatic money movement.
--
-- Idempotent — safe to paste and Run more than once.
-- ============================================================================

create table if not exists public.trip_cancellations (
  id uuid primary key default gen_random_uuid(),
  trip_booking_id uuid not null references public.trip_bookings(id) on delete cascade,
  traveler_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  -- pending -> approved -> refunded, or pending -> rejected
  status text not null default 'pending',
  currency text,
  refund_amount numeric,           -- dollars, canonical style (like trip_bookings)
  admin_notes text,
  decided_by uuid,                 -- admin who approved/rejected
  decided_at timestamptz,
  stripe_refund_id text,           -- from the manual Stripe refund, optional
  refunded_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists trip_cancellations_booking_idx
  on public.trip_cancellations(trip_booking_id);
create index if not exists trip_cancellations_status_idx
  on public.trip_cancellations(status);

alter table public.trip_cancellations enable row level security;

-- Traveler: may file a request for their OWN booking, and read their own requests.
drop policy if exists "Traveler can request cancellation" on public.trip_cancellations;
create policy "Traveler can request cancellation"
  on public.trip_cancellations for insert
  with check (
    auth.uid() = traveler_id
    and exists (
      select 1 from public.trip_bookings tb
      where tb.id = trip_booking_id
        and tb.traveler_id = auth.uid()
    )
  );

drop policy if exists "Traveler can view own cancellations" on public.trip_cancellations;
create policy "Traveler can view own cancellations"
  on public.trip_cancellations for select
  using (auth.uid() = traveler_id);

-- Admin: read everything. No client UPDATE policy on purpose — all decisions
-- go through the admin-process-cancellation edge function (service role),
-- which verifies the admin and writes the audit fields.
drop policy if exists "Admins can view all cancellations" on public.trip_cancellations;
create policy "Admins can view all cancellations"
  on public.trip_cancellations for select
  using (public.has_role(auth.uid(), 'admin'));

-- Optional sanity check after running (should return the new table):
-- select count(*) as trip_cancellations_rows from public.trip_cancellations;
-- And to confirm the legacy table really is dormant:
-- select count(*) as legacy_cancellation_rows from public.booking_cancellations;
