-- Storyboards table
create table if not exists public.storyboards (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references public.trips(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  owner_role text check (owner_role in ('creator','agent','traveler')),
  title text,
  description text,
  theme_tags text[],
  visibility text not null default 'trip' 
    check (visibility in ('private','trip','public_template')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_storyboards_trip_id on public.storyboards(trip_id);
create index if not exists idx_storyboards_owner_id on public.storyboards(owner_id);

alter table public.storyboards enable row level security;

create policy "Owner can manage storyboards"
on public.storyboards
for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "Trip participants can read trip storyboards"
on public.storyboards
for select
using (
  trip_id in (select id from public.trips where traveler_id = auth.uid())
  or owner_id = auth.uid()
);

-- Storyboard items table
create table if not exists public.storyboard_items (
  id uuid primary key default gen_random_uuid(),
  storyboard_id uuid not null references public.storyboards(id) on delete cascade,
  order_index integer not null default 0,
  layout_type text not null default 'masonry' 
    check (layout_type in ('masonry','full','half','third')),
  media_url text,
  media_attribution text,
  caption text,
  location_label text,
  day_number integer,
  time_of_day text,
  category_tag text,
  created_at timestamptz not null default now()
);

create index if not exists idx_storyboard_items_storyboard_id on public.storyboard_items(storyboard_id);
create index if not exists idx_storyboard_items_order on public.storyboard_items(storyboard_id, order_index);

alter table public.storyboard_items enable row level security;

create policy "Storyboard owner manages items"
on public.storyboard_items
for all
using (
  storyboard_id in (
    select id from public.storyboards where owner_id = auth.uid()
  )
)
with check (
  storyboard_id in (
    select id from public.storyboards where owner_id = auth.uid()
  )
);

-- Trigger for updated_at
create trigger handle_storyboards_updated_at before update on public.storyboards
  for each row execute function public.handle_updated_at();