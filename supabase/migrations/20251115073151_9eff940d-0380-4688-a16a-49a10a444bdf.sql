-- Rename bookings to trip_bookings to avoid conflicts with legacy booking system
alter table public.bookings rename to trip_bookings;

-- Update policies to reference new table name
drop policy if exists "Traveler and partner can view their bookings" on public.trip_bookings;
drop policy if exists "No direct public updates to bookings" on public.trip_bookings;

create policy "Traveler and partner can view their trip bookings"
on public.trip_bookings
for select
using (
  auth.uid() = traveler_id
  or auth.uid() = partner_id
);

create policy "No direct public updates to trip bookings"
on public.trip_bookings
for update
using (false)
with check (false);

-- Update booking_status_history foreign key
alter table public.booking_status_history 
drop constraint booking_status_history_booking_id_fkey;

alter table public.booking_status_history
add constraint booking_status_history_booking_id_fkey
foreign key (booking_id) references public.trip_bookings(id) on delete cascade;

-- Update booking_disputes foreign key
alter table public.booking_disputes
drop constraint booking_disputes_booking_id_fkey;

alter table public.booking_disputes
add constraint booking_disputes_booking_id_fkey
foreign key (booking_id) references public.trip_bookings(id) on delete cascade;

-- Update policies
drop policy if exists "Participants and admin can view booking status history" on public.booking_status_history;

create policy "Participants can view trip booking status history"
on public.booking_status_history
for select
using (
  booking_id in (
    select id from public.trip_bookings
    where traveler_id = auth.uid()
       or partner_id = auth.uid()
  )
);

drop policy if exists "Participants can view disputes on their bookings" on public.booking_disputes;

create policy "Participants can view disputes on their trip bookings"
on public.booking_disputes
for select
using (
  booking_id in (
    select id from public.trip_bookings
    where traveler_id = auth.uid()
       or partner_id = auth.uid()
  )
);

-- Restore old bookings table for legacy functionality
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  guest_id uuid references public.guests(id),
  booking_type text not null,
  booking_reference text,
  booking_data jsonb not null,
  total_price numeric not null,
  currency text not null default 'USD',
  status text not null default 'pending',
  payment_status text,
  payment_method text,
  agent_id uuid references public.travel_agents(id),
  commission_earned numeric,
  stripe_payment_intent_id text,
  stripe_fee numeric,
  base_cost numeric,
  markup_percentage numeric,
  markup_amount numeric,
  net_profit numeric,
  booking_source text,
  cancellation_policy_id uuid references public.booking_cancellation_policies(id),
  cancellation_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bookings enable row level security;

create policy "Users can view their own bookings"
on public.bookings
for select
using (auth.uid() = user_id);