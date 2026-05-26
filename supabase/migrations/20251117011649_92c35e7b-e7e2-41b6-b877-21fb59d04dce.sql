-- Create booking_messages table for chat within bookings
create table if not exists public.booking_messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- CREATE INDEX IF NOT EXISTS for efficient queries
create index if not exists booking_messages_booking_id_idx
  on public.booking_messages (booking_id, created_at desc);

create index if not exists booking_messages_sender_id_idx
  on public.booking_messages (sender_id);

-- Enable RLS
alter table public.booking_messages enable row level security;

-- RLS policies: users can see messages from their bookings
create policy "Users can view messages from their bookings"
  on public.booking_messages
  for select
  using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_messages.booking_id
        and (
          b.traveler_id = auth.uid() or
          b.creator_id = auth.uid() or
          b.agent_id = auth.uid()
        )
    )
  );

-- RLS policy: users can send messages to their bookings
create policy "Users can send messages to their bookings"
  on public.booking_messages
  for insert
  with check (
    exists (
      select 1 from public.bookings b
      where b.id = booking_messages.booking_id
        and (
          b.traveler_id = auth.uid() or
          b.creator_id = auth.uid() or
          b.agent_id = auth.uid()
        )
    )
  );

-- Enable realtime
alter publication supabase_realtime add table public.booking_messages;

-- Create trigger for updated_at
create or replace function public.update_booking_messages_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_booking_messages_updated_at
  before update on public.booking_messages
  for each row
  execute function public.update_booking_messages_updated_at();
