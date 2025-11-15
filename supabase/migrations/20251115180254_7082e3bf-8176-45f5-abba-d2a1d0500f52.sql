-- A. payout_accounts – where money goes (Stripe, etc.)
create table if not exists public.payout_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  provider text not null default 'stripe'
    check (provider in ('stripe','paypal','manual')),

  provider_account_id text not null,  -- e.g. Stripe Connect account ID
  currency text not null default 'USD',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_payout_accounts_user_provider
  on public.payout_accounts(user_id, provider);

alter table public.payout_accounts enable row level security;

create policy "User can manage their payout accounts"
on public.payout_accounts
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- C. payouts – groups of ledger entries paid in one go
create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'stripe',
  provider_payout_id text,        -- e.g. Stripe payout/batch id

  amount numeric not null,
  currency text not null default 'USD',

  status text not null default 'initiated'
    check (status in ('initiated','processing','paid','failed')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_payouts_user on public.payouts(user_id);

alter table public.payouts enable row level security;

create policy "User can see their payouts"
on public.payouts
for select
using (auth.uid() = user_id);

-- B. earnings_ledger – source of truth for who earns what
create table if not exists public.earnings_ledger (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('agent','creator','platform')),
  amount numeric not null,
  currency text not null default 'USD',

  status text not null default 'pending'
    check (status in ('pending','available','locked','paid')),

  payout_id uuid references public.payouts(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_earnings_ledger_user on public.earnings_ledger(user_id);
create index if not exists idx_earnings_ledger_booking on public.earnings_ledger(booking_id);

alter table public.earnings_ledger enable row level security;

create policy "User can see their earnings"
on public.earnings_ledger
for select
using (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
create or replace function public.update_earnings_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger earnings_ledger_updated_at
  before update on public.earnings_ledger
  for each row
  execute function public.update_earnings_updated_at();

create trigger payout_accounts_updated_at
  before update on public.payout_accounts
  for each row
  execute function public.handle_updated_at();

create trigger payouts_updated_at
  before update on public.payouts
  for each row
  execute function public.handle_updated_at();