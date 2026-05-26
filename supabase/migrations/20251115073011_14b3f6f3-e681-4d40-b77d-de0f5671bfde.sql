-- Drop existing bookings table to recreate with proper escrow schema
drop table if exists public.bookings cascade;

-- Core bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid primary key default gen_random_uuid(),

  -- Relationships
  trip_request_id uuid not null references public.trip_requests(id) on delete cascade,
  proposal_id uuid not null references public.trip_proposals(id) on delete restrict,

  traveler_id uuid not null,
  partner_id uuid not null,
  partner_role text not null check (partner_role in ('agent', 'creator', 'agent_creator_team')),

  -- Money
  currency text not null default 'USD',
  total_price integer not null,              -- in cents, total booking amount
  platform_commission integer not null,      -- in cents, your cut
  partner_payout integer not null,          -- in cents, net to partner after commission

  -- Stripe / escrow hooks (can be wired later)
  stripe_payment_intent_id text,
  stripe_payment_status text,
  stripe_transfer_group text,

  -- Booking lifecycle
  status text not null default 'pending' check (
    status in (
      'pending',     -- traveler accepted proposal, payment in progress
      'confirmed',   -- payment succeeded, trip is locked in
      'in_progress', -- trip happening
      'completed',   -- trip finished
      'cancelled',   -- cancelled via policy
      'disputed'     -- an active dispute exists
    )
  ),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bookings enable row level security;

-- RLS: traveler or partner can see their booking
create policy "Traveler and partner can view their bookings"
on public.bookings
for select
using (
  auth.uid() = traveler_id
  or auth.uid() = partner_id
);

-- Only internal services / admin should update bookings; for now restrict to service role
create policy "No direct public updates to bookings"
on public.bookings
for update
using (false)
with check (false);

-- Audit trail for every status change
CREATE TABLE IF NOT EXISTS public.booking_status_history (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  old_status text,
  new_status text not null,
  changed_by uuid,
  reason text,
  created_at timestamptz not null default now()
);

alter table public.booking_status_history enable row level security;

create policy "Participants and admin can view booking status history"
on public.booking_status_history
for select
using (
  booking_id in (
    select id from public.bookings
    where traveler_id = auth.uid()
       or partner_id = auth.uid()
  )
);

-- Foundation for disputes / support
CREATE TABLE IF NOT EXISTS public.booking_disputes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,

  opened_by uuid not null,
  type text not null check (type in ('quality', 'cancellation', 'billing', 'other')),
  status text not null default 'open' check (status in ('open', 'under_review', 'resolved', 'rejected')),
  summary text not null,
  details text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.booking_disputes enable row level security;

create policy "Participants can view disputes on their bookings"
on public.booking_disputes
for select
using (
  booking_id in (
    select id from public.bookings
    where traveler_id = auth.uid()
       or partner_id = auth.uid()
  )
);

create policy "Participants can open disputes"
on public.booking_disputes
for insert
with check (
  opened_by = auth.uid()
);