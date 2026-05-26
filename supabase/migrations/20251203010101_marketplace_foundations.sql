-- Marketplace escrow & compliance foundations

-- Extend bookings table with escrow + commission tracking
alter table if exists public.bookings
  add column if not exists total_price_cents bigint,
  add column if not exists currency text default 'USD',
  add column if not exists creator_id uuid references public.profiles(id),
  add column if not exists agent_id uuid references public.profiles(id),
  add column if not exists commission_mode text check (commission_mode in ('solo_creator','solo_agent','collab')),
  add column if not exists platform_fee_pct numeric,
  add column if not exists platform_fee_amount_cents bigint,
  add column if not exists creator_commission_pct numeric,
  add column if not exists creator_commission_amount_cents bigint,
  add column if not exists agent_commission_pct numeric,
  add column if not exists agent_commission_amount_cents bigint,
  add column if not exists escrow_status text check (escrow_status in ('HELD','PARTIALLY_RELEASED','RELEASED','ON_HOLD')) default 'HELD',
  add column if not exists escrow_held_amount_cents bigint,
  add column if not exists escrow_released_amount_cents bigint default 0,
  add column if not exists escrow_on_hold_amount_cents bigint default 0,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancellation_reason text;

-- Booking milestones for escrow releases
create table if not exists public.booking_milestones (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  label text not null,
  due_at timestamptz,
  percentage numeric not null,
  status text not null default 'PENDING' check (status in ('PENDING','RELEASED','ON_HOLD','CANCELLED')),
  created_at timestamptz not null default now()
);

alter table public.booking_milestones enable row level security;

create policy "participants_can_view_milestones"
on public.booking_milestones
for select
using (
  booking_id in (
    select id from public.bookings
    where traveler_id = auth.uid()
       or agent_id = auth.uid()
       or creator_id = auth.uid()
  )
);

create policy "service_role_writes_milestones"
on public.booking_milestones
for insert
with check (auth.role() = 'service_role');

-- Commission negotiation on proposals
alter table if exists public.trip_proposals
  add column if not exists creator_commission_pct numeric,
  add column if not exists agent_commission_pct numeric,
  add column if not exists creator_id uuid references public.profiles(id),
  add column if not exists agent_id uuid references public.profiles(id);

-- Cancellation policies catalog
create table if not exists public.cancellation_policies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  rules jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.cancellation_policies enable row level security;
create policy "policies_readable"
on public.cancellation_policies
for select
using (true);

alter table if exists public.bookings
  add column if not exists cancellation_policy_id uuid references public.cancellation_policies(id);

-- Disputes table
create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  raised_by uuid not null references public.profiles(id),
  type text not null check (type in ('quality','non-delivery','billing','other')),
  status text not null default 'OPEN' check (status in ('OPEN','UNDER_REVIEW','RESOLVED','REJECTED')),
  summary text not null,
  details text,
  resolution text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.disputes enable row level security;
create policy "participants_can_view_disputes"
on public.disputes
for select
using (
  booking_id in (
    select id from public.bookings
    where traveler_id = auth.uid()
       or agent_id = auth.uid()
       or creator_id = auth.uid()
  )
);

create policy "participants_can_open_disputes"
on public.disputes
for insert
with check (raised_by = auth.uid());

-- Reviews
drop table if exists public.reviews cascade;
drop table if exists reviews cascade;
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id),
  agent_id uuid references public.profiles(id),
  creator_id uuid references public.profiles(id),
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;
create policy "participants_can_view_reviews"
on public.reviews
for select
using (
  reviewer_id = auth.uid()
  or agent_id = auth.uid()
  or creator_id = auth.uid()
);

create policy "travelers_leave_reviews"
on public.reviews
for insert
with check (reviewer_id = auth.uid());

-- Messaging log
drop table if exists public.messages cascade;
drop table if exists messages cascade;
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid,
  trip_request_id uuid references public.trip_requests(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  receiver_id uuid references public.profiles(id),
  body text not null,
  safety_flag text,
  is_read boolean default false,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.messages enable row level security;
create policy "participants_can_view_messages"
on public.messages
for select
using (
  sender_id = auth.uid()
  or receiver_id = auth.uid()
  or booking_id in (
    select id from public.bookings
    where traveler_id = auth.uid()
       or agent_id = auth.uid()
       or creator_id = auth.uid()
  )
);

create policy "participants_can_send_messages"
on public.messages
for insert
with check (
  sender_id = auth.uid()
);

-- Profile compliance fields
alter table if exists public.profiles
  add column if not exists agent_license_state text,
  add column if not exists agent_license_authority text,
  add column if not exists professional_insurance_provider text,
  add column if not exists professional_insurance_policy text,
  add column if not exists kyc_status text check (kyc_status in ('none','pending','verified','rejected')) default 'none',
  add column if not exists avg_rating numeric,
  add column if not exists rating_count integer default 0;

-- Messaging + compliance indexes
create index if not exists idx_booking_milestones_booking on public.booking_milestones(booking_id);
create index if not exists idx_disputes_booking on public.disputes(booking_id);
create index if not exists idx_reviews_booking on public.reviews(booking_id);
create index if not exists idx_messages_booking on public.messages(booking_id);

create or replace function public.update_profile_rating_from_review()
returns trigger as $$
declare
  target_profile uuid;
begin
  if new.agent_id is not null then
    target_profile := new.agent_id;
  elsif new.creator_id is not null then
    target_profile := new.creator_id;
  else
    return new;
  end if;

  update public.profiles
  set rating_count = coalesce(rating_count, 0) + 1,
      avg_rating = (
        (coalesce(avg_rating, 0) * coalesce(rating_count, 0)) + new.rating
      ) / nullif(coalesce(rating_count, 0) + 1, 0)
  where id = target_profile;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists reviews_update_profile_rating on public.reviews;

create trigger reviews_update_profile_rating
after insert on public.reviews
for each row execute function public.update_profile_rating_from_review();
