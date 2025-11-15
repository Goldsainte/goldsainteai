-- Create trip_proposals table
create table if not exists public.trip_proposals (
  id uuid primary key default gen_random_uuid(),
  trip_request_id uuid not null references public.trip_requests(id) on delete cascade,
  proposer_id uuid not null,
  proposer_role text not null check (proposer_role in ('agent', 'creator')),
  headline text,
  message text,
  price_from integer,
  currency text default 'USD',
  status text not null default 'sent' check (status in ('sent', 'accepted', 'declined', 'withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.trip_proposals enable row level security;

-- Policy: Creators/agents can insert their own proposals
create policy "Creators/agents can insert proposals"
on public.trip_proposals
for insert
to authenticated
with check (auth.uid() = proposer_id);

-- Policy: View proposals you sent or received
create policy "Users can view proposals they sent or received"
on public.trip_proposals
for select
to authenticated
using (
  auth.uid() = proposer_id
  or trip_request_id in (
    select id from public.trip_requests where user_id = auth.uid()
  )
);

-- Policy: Proposers can update their own proposals
create policy "Proposers can update own proposals"
on public.trip_proposals
for update
to authenticated
using (auth.uid() = proposer_id)
with check (auth.uid() = proposer_id);

-- Add indexes for better query performance
create index if not exists idx_trip_proposals_request_id on public.trip_proposals(trip_request_id);
create index if not exists idx_trip_proposals_proposer_id on public.trip_proposals(proposer_id);
create index if not exists idx_trip_proposals_status on public.trip_proposals(status);

-- Add updated_at trigger
create or replace function update_trip_proposals_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql set search_path = public;

create trigger trip_proposals_updated_at
before update on public.trip_proposals
for each row
execute function update_trip_proposals_updated_at();