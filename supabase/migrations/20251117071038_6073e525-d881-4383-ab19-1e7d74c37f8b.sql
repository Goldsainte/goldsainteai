-- Add creator metadata columns to profiles table (if not exists)
alter table profiles
add column if not exists creator_niches text[] default '{}',
add column if not exists creator_avg_views int,
add column if not exists creator_followers int,
add column if not exists featured_photos text[] default '{}',
add column if not exists tiktok_handle text,
add column if not exists instagram_handle text,
add column if not exists location text;