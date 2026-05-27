## Goal

Copy the 33 `packaged_trips` rows from the old backend (`iwdevxltjuedijrcdejs`) into the live backend (`ktzsgqrqvwtxlimctkaf`) so the marketplace loads them directly from the database. Once done, the local `src/data/seededTrips.ts` fallback can be removed.

## What I confirmed in the old backend

- 33 rows in `packaged_trips`.
- 0 rows in `package_itinerary` for those trips (no day-by-day data to copy).
- All 33 trips have `creator_id = NULL` and `agent_id = NULL` — no profile/user FK dependencies.
- Cover images: most point to `images.unsplash.com` (safe), but some point to `https://iwdevxltjuedijrcdejs.supabase.co/storage/v1/object/public/trip-assets/...` and will 404 once the old project is gone.

## Plan

1. **Read all 33 rows in full** from the old backend (every column, preserving `id`, `slug`, `status`, timestamps).
2. **Generate one idempotent migration** for the live backend that:
   - Inserts all 33 rows into `public.packaged_trips` using `INSERT ... ON CONFLICT (id) DO NOTHING`, so re-running is safe and existing live rows (the current 6) aren't disturbed.
   - Preserves original UUIDs and slugs so any existing links keep working.
   - Leaves `creator_id` / `agent_id` as NULL (matches the "Goldsainte Concierge" / platform-curated branding already used for trips without a host).
3. **Fix broken cover images in the same migration**: for any row whose `cover_image_url` points at the old `iwdevxltjuedijrcdejs.supabase.co` storage bucket, swap it to a verified Unsplash URL from `src/utils/tripImages.ts` (destination-matched) so nothing 404s. Unsplash-hosted covers are copied as-is.
4. **Remove the frontend fallback** once the rows are confirmed in the live DB:
   - Delete `src/data/seededTrips.ts`.
   - Revert the `mergeSeededTrips` block in `src/pages/Marketplace.tsx`.
   - Revert the `getSeededTripBySlug` fallback in `src/pages/trips/TripDetailPage.tsx` (and drop the `as any` cast added for the seeded type).
5. **Verify** in the live preview that Handpicked Trips renders 33+ cards and each trip detail page loads from the DB (not the local fallback).

## Out of scope

- No itinerary/FAQ data is migrated (none exists for these trips in the old DB; the detail page already falls back to the standard `TripFAQAccordion` defaults).
- No creator/agent linkage — trips stay platform-curated. If you want them attributed to a creator later, that's a separate pass.
- Storage bucket contents (videos, gallery images) are not migrated; broken bucket-hosted URLs get swapped to Unsplash equivalents.

## Technical details

- Tool: `supabase--migration` against the live project, single SQL file with one `INSERT ... SELECT FROM (VALUES ...) ON CONFLICT (id) DO NOTHING`.
- JSONB columns (`image_gallery`, `highlights`, `included`, `not_included`, `departure_dates`, `faqs`, `essential_info`) are inserted as JSON literals; array columns (`tags`, `languages`, `meals_included`) as Postgres arrays.
- No schema change required — the live `packaged_trips` table already matches.
- After migration approval, follow-up code edits land in: `src/pages/Marketplace.tsx`, `src/pages/trips/TripDetailPage.tsx`, delete `src/data/seededTrips.ts`.
