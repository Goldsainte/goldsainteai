

# Fix Trip Request Hero Images to Match Destinations

## Problem
The `getTripRequestImageUrl()` function in `src/utils/tripImages.ts` only has 10 hardcoded destination matches (Paris, Maldives, New York, etc.). Any destination not in that list falls back to `picsum.photos/seed/{destination}/1600/900`, which returns random photos with no relation to the actual travel destination.

This function is used in 3 places:
- `src/pages/marketplace/TripRequestDetail.tsx` (hero image)
- `src/components/marketplace/TripRequestGrid.tsx` (card thumbnails)
- `src/pages/trips/MyTripsPage.tsx` (trip request cards)

## Solution
1. Expand the curated `DESTINATION_IMAGES` map from 10 to 50+ popular destinations with high-quality Unsplash photos
2. Change the fallback from random Picsum to Unsplash source search — `https://images.unsplash.com/photo-{id}` using a curated set of travel/landscape fallbacks, or better: use the Unsplash source API `https://source.unsplash.com/1600x900/?{destination},travel` which returns a destination-relevant photo

## File to Edit

### `src/utils/tripImages.ts`
- Add 40+ more curated destination entries covering major travel cities and regions (Rome, Barcelona, Amsterdam, Thailand, Iceland, Greece, Mexico, etc.)
- Change the Picsum fallback to use Unsplash's content-aware URL format: `https://images.unsplash.com/photo-{hash}` with a set of generic luxury travel fallback images randomly selected by destination hash, OR use a simple approach: build a search-based Unsplash URL that returns relevant photos
- Since Unsplash deprecated `source.unsplash.com`, the best approach is to add a large curated map and use a set of ~10 generic luxury travel fallback images (rotated by destination hash) instead of Picsum randoms

## Technical Detail
The fallback strategy:
```typescript
// Instead of picsum random:
// OLD: `https://picsum.photos/seed/${seed}/1600/900`

// NEW: rotate through 10 curated luxury travel fallbacks
const FALLBACK_TRAVEL_IMAGES = [
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?...", // travel planning
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?...", // beach
  // ...etc
];
const index = hashCode(destination) % FALLBACK_TRAVEL_IMAGES.length;
return FALLBACK_TRAVEL_IMAGES[index];
```

This ensures every trip request shows a travel-relevant photo — either a curated match for the destination or a beautiful generic travel image as fallback.

