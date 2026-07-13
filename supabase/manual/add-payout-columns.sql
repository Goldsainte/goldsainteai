-- ============================================================================
-- travel_agents: add the payout columns the Stripe Connect flow needs
-- ============================================================================
-- Jul 13 (launch morning). The Connect status/onboarding functions read and
-- write these columns, but they never existed — the flow was broken upstream
-- of them since birth, so nobody ever hit the missing columns until the
-- Jul 12 rehearsal fixed the auth bug in front of them. Idempotent.

alter table public.travel_agents add column if not exists payout_schedule text default 'daily';
alter table public.travel_agents add column if not exists stripe_account_status text;
alter table public.travel_agents add column if not exists stripe_onboarding_completed boolean default false;
alter table public.travel_agents add column if not exists stripe_charges_enabled boolean default false;
alter table public.travel_agents add column if not exists stripe_payouts_enabled boolean default false;

-- Verify: should list all five columns
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'travel_agents'
  and column_name in ('payout_schedule','stripe_account_status','stripe_onboarding_completed','stripe_charges_enabled','stripe_payouts_enabled')
order by column_name;
