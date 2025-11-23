-- Drop existing tables if they exist (be careful in production!)
drop table if exists public.storyboard_items cascade;
drop table if exists public.storyboards cascade;

-- 1) Storyboards table
create table if not exists public.storyboards (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('creator', 'traveler')),
  title text not null,
  description text,
  is_public boolean not null default false,
  original_storyboard_id uuid references public.storyboards(id) on delete set null,
  source_creator_id uuid references auth.users(id) on delete set null,
  cover_image_url text,
  trip_request_id uuid references public.trip_requests(id) on delete set null,
  tags text[] default '{}',
  view_count integer not null default 0
);

create index if not exists storyboards_owner_idx on public.storyboards (owner_id);
create index if not exists storyboards_role_idx on public.storyboards (role);
create index if not exists storyboards_original_idx on public.storyboards (original_storyboard_id);
create index if not exists storyboards_public_idx on public.storyboards (is_public);

-- 2) Storyboard items table
create table if not exists public.storyboard_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  storyboard_id uuid not null references public.storyboards(id) on delete cascade,
  item_type text not null check (
    item_type in ('image', 'creator', 'agent', 'brand', 'note', 'video')
  ),
  title text,
  subtitle text,
  description text,
  image_url text,
  video_url text,
  source_type text,
  source_id text,
  metadata jsonb default '{}'::jsonb,
  position integer not null default 0
);

create index if not exists storyboard_items_storyboard_idx on public.storyboard_items (storyboard_id);
create index if not exists storyboard_items_position_idx on public.storyboard_items (storyboard_id, position);

-- 3) Enable RLS
alter table public.storyboards enable row level security;
alter table public.storyboard_items enable row level security;

-- 4) RLS Policies for storyboards
create policy "Users can view their own storyboards"
  on public.storyboards for select
  using (auth.uid() = owner_id OR is_public = true);

create policy "Users can create their own storyboards"
  on public.storyboards for insert
  with check (auth.uid() = owner_id);

create policy "Users can update their own storyboards"
  on public.storyboards for update
  using (auth.uid() = owner_id);

create policy "Users can delete their own storyboards"
  on public.storyboards for delete
  using (auth.uid() = owner_id);

-- 5) RLS Policies for storyboard_items
create policy "Users can view items in accessible storyboards"
  on public.storyboard_items for select
  using (
    EXISTS (
      SELECT 1 FROM public.storyboards
      WHERE storyboards.id = storyboard_items.storyboard_id
      AND (storyboards.owner_id = auth.uid() OR storyboards.is_public = true)
    )
  );

create policy "Users can create items in their own storyboards"
  on public.storyboard_items for insert
  with check (
    EXISTS (
      SELECT 1 FROM public.storyboards
      WHERE storyboards.id = storyboard_items.storyboard_id
      AND storyboards.owner_id = auth.uid()
    )
  );

create policy "Users can update items in their own storyboards"
  on public.storyboard_items for update
  using (
    EXISTS (
      SELECT 1 FROM public.storyboards
      WHERE storyboards.id = storyboard_items.storyboard_id
      AND storyboards.owner_id = auth.uid()
    )
  );

create policy "Users can delete items in their own storyboards"
  on public.storyboard_items for delete
  using (
    EXISTS (
      SELECT 1 FROM public.storyboards
      WHERE storyboards.id = storyboard_items.storyboard_id
      AND storyboards.owner_id = auth.uid()
    )
  );

-- 6) Function to update the updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
    NEW.updated_at = now();
    return NEW;
end;
$$ language plpgsql;

-- 7) Trigger for updated_at
create trigger update_storyboards_updated_at before update on public.storyboards
  for each row execute procedure public.update_updated_at_column();