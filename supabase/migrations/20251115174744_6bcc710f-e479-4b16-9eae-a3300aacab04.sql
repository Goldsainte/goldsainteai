-- Drop existing disputes table if it exists
drop table if exists public.booking_disputes cascade;

-- Create new disputes table
create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  raised_by uuid not null,
  status text not null default 'open'
    check (status in ('open','under_review','resolved','rejected')),
  reason text,
  resolution text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_disputes_booking_id on public.disputes(booking_id);
create index if not exists idx_disputes_status on public.disputes(status);

alter table public.disputes enable row level security;

create policy "Participants can see their disputes"
on public.disputes
for select
using (
  raised_by = auth.uid()
  or booking_id in (
    select id from public.bookings
    where traveler_id = auth.uid()
       or agent_id = auth.uid()
       or creator_id = auth.uid()
  )
);

create policy "Participants can create disputes"
on public.disputes
for insert
with check (
  booking_id in (
    select id from public.bookings
    where traveler_id = auth.uid()
       or agent_id = auth.uid()
       or creator_id = auth.uid()
  )
);