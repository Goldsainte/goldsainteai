-- Helper script for local development. Run after creating auth users via the UI.
-- Replace the example email addresses with the ones you used when signing up.

-- Traveler test profile
insert into public.profiles as p (
  id,
  full_name,
  display_name,
  account_type,
  role,
  onboarding_completed,
  is_profile_complete,
  welcome_shown
)
select
  u.id,
  'Traveler Test',
  'Traveler Test',
  'traveler',
  'traveler',
  true,
  true,
  true
from auth.users u
where u.email = 'traveler@example.com'
on conflict (id) do update set
  account_type = excluded.account_type,
  role = excluded.role,
  full_name = excluded.full_name,
  display_name = excluded.display_name,
  onboarding_completed = true,
  is_profile_complete = true,
  welcome_shown = true;

-- Creator test profile
insert into public.profiles as p (
  id,
  full_name,
  display_name,
  account_type,
  role,
  creator_niches,
  creator_budget_levels,
  creator_pov,
  home_base,
  onboarding_completed,
  is_profile_complete,
  has_completed_creator_onboarding
)
select
  u.id,
  'Creator Test',
  'Creator Test',
  'creator',
  'creator',
  array['Food & Wine', 'Wellness'],
  array['elevated', 'ultra_luxury'],
  'Short-form storytelling focused on cinematic recap videos.',
  'NYC → Paris',
  true,
  true,
  true
from auth.users u
where u.email = 'creator@example.com'
on conflict (id) do update set
  account_type = excluded.account_type,
  role = excluded.role,
  creator_niches = excluded.creator_niches,
  creator_budget_levels = excluded.creator_budget_levels,
  creator_pov = excluded.creator_pov,
  home_base = excluded.home_base,
  has_completed_creator_onboarding = true,
  onboarding_completed = true,
  is_profile_complete = true;

-- Agent test profile
insert into public.profiles as p (
  id,
  full_name,
  display_name,
  account_type,
  role,
  agency_name,
  agent_specialties,
  destinations_focus_tags,
  agent_years_experience,
  agent_verification_status,
  onboarding_completed,
  is_profile_complete
)
select
  u.id,
  'Agent Test',
  'Agent Test',
  'agent',
  'agent',
  'Madison Ave Travel',
  array['honeymoons', 'family safaris'],
  array['Paris', 'Mexico City', 'Cape Town'],
  8,
  'approved',
  true,
  true
from auth.users u
where u.email = 'agent@example.com'
on conflict (id) do update set
  account_type = excluded.account_type,
  role = excluded.role,
  agency_name = excluded.agency_name,
  agent_specialties = excluded.agent_specialties,
  destinations_focus_tags = excluded.destinations_focus_tags,
  agent_years_experience = excluded.agent_years_experience,
  agent_verification_status = excluded.agent_verification_status,
  onboarding_completed = true,
  is_profile_complete = true;
