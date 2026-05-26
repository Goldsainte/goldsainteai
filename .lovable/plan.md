# Always show a cover photo on trip cards

## Problem
Some trip cards on the Marketplace and Home page can render without a real photo:
- When `cover_image_url` is null/empty, components show a colored gradient placeholder (e.g. `LiveTripCard`, `TripCard`, `BundleCard`, `ItineraryGuideCard`, Home `FeaturedTripsSection`).
- When the URL is present but the image fails to load (404, broken Supabase storage path, expired CDN), there is no recovery — the broken image stays.

All 33 published `packaged_trips` currently have a cover URL, but the UI must remain robust as new trips, bundles, guides, and live trips appear.

## Approach
Use the existing curated destination → Unsplash registry (`src/utils/tripImages.ts` → `getTripRequestImageUrl(destination, override)`), which already deterministically returns a travel-relevant image for any destination string.

For every trip cover image on Home and Marketplace:
1. Compute `src` as `getTripRequestImageUrl(destination, cover_image_url)` so a missing/empty `cover_image_url` falls back to a destination-matched Unsplash image instead of a gradient placeholder.
2. Add an `onError` handler that swaps the `<img>` `src` to the destination fallback once (guarded to prevent loops) so broken URLs are recovered visually.
3. Remove the gradient/“no cover” empty-state branches so the `<img>` is always rendered.

This is presentation-only — no schema changes, no edge-function calls, no new network dependencies (Unsplash URLs are already used elsewhere).

## Files to update
- `src/pages/HomePage.tsx` — `FeaturedTripsSection` card image.
- `src/components/marketplace/LiveTripCard.tsx` — replace the conditional + gradient fallback with always-rendered `<img>` using the helper, add `onError`.
- `src/components/marketplace/TripCard.tsx` — same treatment.
- `src/components/marketplace/BundleCard.tsx` — same treatment (use `destination` if available, otherwise `title` as the key into the helper).
- `src/components/marketplace/ItineraryGuideCard.tsx` — same treatment.
- `src/components/TopToursCarousel.tsx` — replace inline Unsplash default with helper using `tour.destination`, add `onError`.

## Out of scope
- Database backfill of `cover_image_url`.
- Storyboard / collection cards (not mentioned by user; different data model).
- Hero/marketing sections that use hand-picked Pexels images.

## Verification
- Load `/` and `/marketplace`, confirm every card shows a photo.
- Temporarily set a card’s `cover_image_url` to a broken URL via DevTools override and confirm the fallback kicks in via `onError`.
