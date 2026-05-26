Revert the trip cover image fallback changes from the previous step. The previous edit replaced direct `cover_image_url` usage with `getTripRequestImageUrl(destination, cover_image_url)` and added `onError` fallback handlers on 6 components. This was intended to guarantee a photo always renders, but it caused two regressions:

1. Homepage featured trip images changed (because the helper now overrides the original Unsplash URL in some cases).
2. Marketplace "Handpicked Trips" cards may be filtered/affected by the same change.

## Files to revert

For each file below, restore the `<img>` element to the pre-edit state: use `trip.cover_image_url` (or equivalent field) directly as `src`, remove the `onError` handler that swaps to a fallback, restore any conditional empty-state branches that were removed, and remove the `getTripRequestImageUrl` import if no longer used.

1. `src/pages/HomePage.tsx` — `FeaturedTripsSection` image
2. `src/components/marketplace/LiveTripCard.tsx`
3. `src/components/marketplace/TripCard.tsx`
4. `src/components/marketplace/BundleCard.tsx`
5. `src/components/marketplace/ItineraryGuideCard.tsx`
6. `src/components/TopToursCarousel.tsx`

## Investigation note

The "Handpicked Trips" tab disappearing is likely a separate issue (the query/filter on the marketplace page), not directly caused by the image edits — image fallbacks don't filter rows. After reverting, I'll verify the Handpicked tab loads. If trips are still missing post-revert, I'll inspect the marketplace query/tab component to find the real cause.

## Out of scope

No changes to `src/utils/tripImages.ts`, marketplace query logic, or seed data.