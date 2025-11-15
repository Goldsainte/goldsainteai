-- Media library for shared/system imagery + user-uploaded photos
create table if not exists public.media_library (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  source text not null 
    check (source in ('system','user','tiktok','external')),
  url text not null,
  thumb_url text,
  label text,
  tags text[],
  created_at timestamptz not null default now()
);

create index if not exists idx_media_library_owner on public.media_library(owner_id);
create index if not exists idx_media_library_source on public.media_library(source);
create index if not exists idx_media_library_tags on public.media_library using gin(tags);

alter table public.media_library enable row level security;

create policy "Users read system images"
on public.media_library
for select
using (source = 'system' or owner_id = auth.uid());

create policy "Users manage their own media"
on public.media_library
for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());