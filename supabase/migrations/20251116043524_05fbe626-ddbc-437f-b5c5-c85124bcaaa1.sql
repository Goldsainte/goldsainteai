-- Chat safety events table
create table if not exists public.chat_safety_events (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null,
  message_id uuid,
  sender_id uuid not null,
  event_type text not null,
  reasons text[] not null,
  original_text text not null,
  created_at timestamptz not null default now()
);

alter table public.chat_safety_events enable row level security;

-- Only service role and admins can read safety events
create policy "Service role can manage safety events"
  on public.chat_safety_events
  for all
  using (
    ((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'service_role'::text
  );

create policy "Admins can view safety events"
  on public.chat_safety_events
  for select
  using (
    exists (
      select 1 from user_roles
      where user_roles.user_id = auth.uid()
      and user_roles.role = 'admin'::app_role
    )
  );

-- Reports table
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null,
  reported_user_id uuid,
  conversation_id uuid,
  message_id uuid,
  booking_id uuid,
  report_type text not null,
  description text,
  created_at timestamptz not null default now(),
  status text not null default 'open'
);

alter table public.reports enable row level security;

-- Users can create their own reports
create policy "Users can create reports"
  on public.reports
  for insert
  with check (auth.uid() = reporter_id);

-- Users can view their own reports
create policy "Users can view their own reports"
  on public.reports
  for select
  using (auth.uid() = reporter_id);

-- Admins and support can view all reports
create policy "Admins can view all reports"
  on public.reports
  for select
  using (
    exists (
      select 1 from user_roles
      where user_roles.user_id = auth.uid()
      and user_roles.role = 'admin'::app_role
    )
  );

-- Admins can update report status
create policy "Admins can update reports"
  on public.reports
  for update
  using (
    exists (
      select 1 from user_roles
      where user_roles.user_id = auth.uid()
      and user_roles.role = 'admin'::app_role
    )
  );