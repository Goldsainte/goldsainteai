-- First, create trips table if it doesn't exist
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  traveler_id uuid not null,
  title text not null,
  destination text not null,
  description text,
  start_date date,
  end_date date,
  travelers_count integer default 1,
  budget_range text,
  status text not null default 'planning',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add indexes for trips
create index if not exists idx_trips_traveler_id on public.trips(traveler_id);
create index if not exists idx_trips_status on public.trips(status);

-- Enable RLS on trips
alter table public.trips enable row level security;

-- Policies for trips
drop policy if exists "Users can view their own trips" on public.trips;
create policy "Users can view their own trips"
on public.trips for select
using (auth.uid() = traveler_id);

drop policy if exists "Users can create their own trips" on public.trips;
create policy "Users can create their own trips"
on public.trips for insert
with check (auth.uid() = traveler_id);

drop policy if exists "Users can update their own trips" on public.trips;
create policy "Users can update their own trips"
on public.trips for update
using (auth.uid() = traveler_id);