-- ============================================================================
-- trip_payouts — the per-booking release ledger for milestone escrow
-- ============================================================================
-- Created Jul 11 weekend, alongside release-trip-deposit v4.
--
-- The escrow model: traveler money sits with Goldsainte until released in
-- (up to) two milestones, each paying 96.5% of its slice:
--   'deposit' — the partner's working capital, released by the TRAVELER
--               once the partner has shown them confirmed reservations
--               (admin fallback).
--   'final'   — the remainder, released by the TRAVELER confirming the trip
--               is complete (Fiverr-style consent; admin fallback).
-- Every transfer writes a row here; a unique index makes double-release
-- impossible. Writes happen ONLY through the release-trip-deposit edge
-- function (service role) — no client insert/update policies on purpose.
--
-- Idempotent — safe to paste and Run more than once.
-- ============================================================================

create table if not exists public.trip_payouts (
  id uuid primary key default gen_random_uuid(),
  trip_booking_id uuid not null references public.trip_bookings(id) on delete cascade,
  milestone text not null,            -- 'deposit' | 'final'
  base_amount numeric not null,       -- the slice this milestone covers (dollars)
  payout_amount numeric not null,     -- 96.5% of base (dollars) actually transferred
  platform_fee numeric not null,      -- base - payout (dollars)
  stripe_transfer_id text,
  released_by uuid not null,          -- who clicked
  released_via text not null,         -- 'admin' | 'traveler_confirmation'
  created_at timestamptz not null default now()
);

-- One release per milestone per booking, ever.
create unique index if not exists trip_payouts_booking_milestone_key
  on public.trip_payouts(trip_booking_id, milestone);

create index if not exists trip_payouts_booking_idx
  on public.trip_payouts(trip_booking_id);

alter table public.trip_payouts enable row level security;

drop policy if exists "Admins can view payouts" on public.trip_payouts;
create policy "Admins can view payouts"
  on public.trip_payouts for select
  using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Traveler can view own booking payouts" on public.trip_payouts;
create policy "Traveler can view own booking payouts"
  on public.trip_payouts for select
  using (
    exists (
      select 1 from public.trip_bookings tb
      where tb.id = trip_booking_id and tb.traveler_id = auth.uid()
    )
  );

drop policy if exists "Partner can view own booking payouts" on public.trip_payouts;
create policy "Partner can view own booking payouts"
  on public.trip_payouts for select
  using (
    exists (
      select 1 from public.trip_bookings tb
      where tb.id = trip_booking_id and tb.partner_id = auth.uid()
    )
  );

-- Optional sanity check after running:
-- select count(*) as payout_rows from public.trip_payouts;
