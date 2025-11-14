-- Stores user-level TikTok OAuth tokens
create table if not exists public.tiktok_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tiktok_user_id text not null,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists tiktok_tokens_user_id_key
  on public.tiktok_tokens (user_id);

-- Simple "Trip Story" log so UI can show history
create table if not exists public.trip_stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  hook text,
  caption text not null,
  hero_image_url text,
  itinerary jsonb,
  posted_to_tiktok boolean not null default false,
  tiktok_video_id text,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.tiktok_tokens enable row level security;
alter table public.trip_stories enable row level security;

-- RLS policies
create policy "Users can manage their own TikTok tokens"
on public.tiktok_tokens
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage their own trip stories"
on public.trip_stories
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);