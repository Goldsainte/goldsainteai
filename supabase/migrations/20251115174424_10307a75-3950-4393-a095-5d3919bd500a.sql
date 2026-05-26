-- Drop old bookings table (no longer needed for flights/hotels)
drop table if exists public.bookings cascade;

-- Create new bookings table for trips
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  traveler_id uuid not null,
  agent_id uuid,
  creator_id uuid,
  proposal_id uuid references public.trip_proposals(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending','awaiting_payment','paid','in_progress','completed','canceled','disputed')),
  total_amount numeric,
  currency text default 'USD',
  platform_fee numeric,
  agent_share numeric,
  creator_share numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_trip_id on public.bookings(trip_id);
CREATE INDEX IF NOT EXISTS idx_bookings_traveler_id on public.bookings(traveler_id);
CREATE INDEX IF NOT EXISTS idx_bookings_agent_id on public.bookings(agent_id);
CREATE INDEX IF NOT EXISTS idx_bookings_creator_id on public.bookings(creator_id);

alter table public.bookings enable row level security;

create policy "Traveler can see own bookings"
on public.bookings for select
using (auth.uid() = traveler_id);

create policy "Agent can see their bookings"
on public.bookings for select
using (auth.uid() = agent_id);

create policy "Creator can see their bookings"
on public.bookings for select
using (auth.uid() = creator_id);

-- Create payment_intents table
CREATE TABLE IF NOT EXISTS public.payment_intents (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  provider text not null default 'stripe',
  provider_intent_id text,
  status text not null default 'created'
    check (status in ('created','requires_action','succeeded','canceled','failed')),
  amount numeric not null,
  currency text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_payment_intents_booking_id on public.payment_intents(booking_id);

alter table public.payment_intents enable row level security;

create policy "Booking participants can read intents"
on public.payment_intents for select
using (
  booking_id in (
    select id from public.bookings
    where traveler_id = auth.uid()
       or agent_id = auth.uid()
       or creator_id = auth.uid()
  )
);
