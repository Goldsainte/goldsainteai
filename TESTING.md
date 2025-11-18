# Manual testing guide

The app has three primary personas. Use the same auth flow (`/login` or `/signup`) for every role so that QA always exercises the consolidated Auth experience.

## 1. Create local test users via the UI

1. Run `npm run dev` and open `http://localhost:5173/login`.
2. Sign up three accounts with the following emails (or any emails you control):
   - `traveler@example.com`
   - `creator@example.com`
   - `agent@example.com`
3. Complete the email confirmation step if Supabase is configured to require it.

## 2. Mark the profiles with the right role metadata

Update the `profiles` rows so each user unlocks the correct dashboards:

### Option A – SQL helper (recommended)

1. Edit `supabase/seed-test-users.sql` and replace the example email addresses with the ones you just registered.
2. Run the script inside the Supabase SQL editor or via `supabase db remote commit`.
3. Each `INSERT ... ON CONFLICT` call will stamp the correct `account_type`, `role`, and demo data (specialties, destinations, etc.).

### Option B – Manual edits in Supabase Studio

1. Open the `profiles` table and locate each user by email/ID.
2. Traveler: set `account_type = 'traveler'`, `role = 'traveler'`, toggle `onboarding_completed`, `is_profile_complete`, and `welcome_shown` to `true`.
3. Creator: set `account_type = 'creator'`, add a `display_name`, populate `creator_niches` + `creator_budget_levels`, and set `has_completed_creator_onboarding = true`.
4. Agent: set `account_type = 'agent'`, fill in `agency_name`, `agent_specialties`, `destinations_focus_tags`, and set `agent_verification_status = 'approved'` so restricted agent routes unlock.

## 3. Role-specific smoke tests

### Traveler checklist
- From `/` hit the hero CTAs to `/post-trip`, `/creators`, `/agents`, and `/concierge` without typing URLs.
- Post a trip on `/post-trip` and confirm the toast + redirect to `/trip-request/:id` or `/my-trip-requests`.
- Refresh `/my-trip-requests` and confirm the new brief appears at the top.
- Trigger Madison from the floating “Hey Goldsainte” button, send a prompt, and open the full `/concierge` planner from the widget link.
- Visit `/tiktok-lab/storyboards` and open a storyboard detail page.
- After booking is marked completed, open `/my-bookings` and leave reviews for both the agent and creator.

### Creator checklist
- Visit `/creators` from the header/mobile menu and filter/browse.
- Complete the creator onboarding form if needed (Profile → “Creator settings”).
- Open `/tiktok-lab/storyboards` and `/tiktok-lab/storyboards/:id` to edit media.
- Confirm `/tiktok-lab/earnings` loads once the SQL seed marks the account as a creator.
- Verify the per-booking payouts reflect collaborative vs. solo commissions.

### Agent checklist
- From the header select “Professional → Become an Agent” to reach `/agent-onboarding`.
- After the profile is marked as an agent, ensure `/agent-dashboard`, `/agent-trip-requests`, `/trip-requests`, and `/apply/agent` all render without auth loops.
- Check `/trip-requests` to verify open traveler briefs are visible and `/trip-request/:id` shows the detail view.
- Visit `/agent/earnings` for the booking payout ledger and `/partner/escrow` to monitor milestone releases.

## 4. Helpful references
- `supabase/seed-test-users.sql` — opinionated inserts for local-only data seeding.
- `src/pages/Auth.tsx` — the only login + signup surface; use this to validate social auth buttons.
- `src/pages/trips/PostTripPage.tsx` + `src/pages/MyTripRequestsPage.tsx` — core traveler workflow.
- `src/pages/TikTokLab/StoryboardsPage.tsx` — canonical storyboard list.
- `src/routes/AppRoutes.tsx` — authoritative list of active routes for regression testing.

Run `npm run lint` before delivering changes to ensure no TypeScript or ESLint regressions were introduced during manual testing.
