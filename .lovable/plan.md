# Trip Posting Flow — Fixes & Additions (revised)

## 1. Database migration
- Add columns to `packaged_trips`: `languages text[]`, `minimum_age integer`, `accommodation_type text`, `meals_included text[]`.
- Drop & recreate `packaged_trips_status_check` to include `'pending_review'`.
- Update RLS on `trip_itinerary_days` so the owner policy matches on **either** `creator_id = auth.uid()` **or** `agent_id = auth.uid()`.

Note: the user request mentioned `package_itinerary`, but that table FK's to `agent_packages`. The correct table for `packaged_trips` itineraries is `trip_itinerary_days` — using that.

## 2. Role-aware "Post a Trip" navigation
- `Header.tsx` and `MobileBottomNav.tsx`: use `useUserRole()` (+ `useAuth`). Agents/creators → `/trip-builder`; travelers/anon → `/post-trip`.

## 3. AgentTripsPage rewrite
- Query `packaged_trips` by `agent_id = user.id`. Cards with status badge, booking_count, view_count, Edit → `/trip-builder?edit={id}`, View Listing → `/marketplace/trip/{slug}`. Top "Create New Trip" → `/trip-builder`.

## 4. TripBuilderForm enhancements
Tab order: **Basics → Details → Itinerary → Media → Requirements → Policies** (confirmed).
- **Basics**: add `languages` (multi-select chips), `minimum_age` (number), `accommodation_type` (select).
- **Details**: add `meals_included` checkbox group (Breakfast / Lunch / Dinner / Snacks).
- **Itinerary** (NEW): auto-generate `duration_days` cards. Each = day#, title, description, activities (ArrayFieldEditor), accommodation, meals checkboxes, featured-day toggle. Held in form state as `itinerary_days`.
- **Requirements**: Departure Dates section. Radio Flexible vs Fixed; when Fixed, calendar picker with chips of selected ISO dates → `departure_dates` jsonb array.

## 5. TripBuilderPage save logic
- After upserting the trip row, sync `trip_itinerary_days`: delete-then-insert keyed by `(trip_id, day_number)`.
- **Preview button**: auto-save as draft, toast `"Saved as draft — opening preview..."`, then open `/marketplace/trip/{slug}` (fallback `/trip/{id}`).
- **Publish button**: set `status = 'pending_review'` (not `'published'`). Toast: "Your trip has been submitted for review. We typically review listings within 24 hours and will notify you when it's live."
- **Gap 2 — re-publish guard**: if the existing `tripData.status` is `pending_review` or `published` and the requested new status is `published`, block with toast: "This trip is already submitted or live. Contact support to make changes."
- **Gap 1 — admin notifications**: when a submission transitions a trip into `pending_review`, query `user_roles` where `role = 'admin'` and insert one `notifications` row per admin: `{ user_id: adminId, type: 'trip_pending_review', title: 'New trip awaiting review', entity_type: 'packaged_trips', entity_id: tripId, is_read: false }`. Best-effort (errors logged, not blocking).

## 6. Admin review
- `AdminTripsPage.tsx`: add status filter including "Pending Review". For `pending_review` rows, show **Approve** button → status `'published'`, `published_at = now()`.

## File touch list
- migration (new)
- src/components/Header.tsx
- src/components/navigation/MobileBottomNav.tsx
- src/pages/AgentTripsPage.tsx
- src/components/trips/TripBuilderForm.tsx
- src/pages/TripBuilderPage.tsx
- src/pages/admin/AdminTripsPage.tsx
