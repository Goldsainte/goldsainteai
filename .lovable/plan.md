## Plan: Restore Fallback Cover Images with Shared Component

### Problem
Trip, bundle, and guide cards render `<img src={cover_image_url || ""}>` — when the URL is missing or the image fails to load, the card shows a blank/broken tile.

### Solution
Create one shared component that handles the fallback consistently, then use it in all 6 card components.

### Step 1 — Create shared component
Create `src/components/marketplace/TripCoverImage.tsx`:
- Accepts `src`, `alt`, `className`, `loading`
- Uses `useState` to track load failure
- Falls back to `@/assets/luxury-destinations.jpg` when `src` is falsy or `onError` fires

### Step 2 — Replace cover `<img>` tags (keeping existing className/loading/alt)
In each file below, replace ONLY the main cover-image `<img>` element with `<TripCoverImage>`, preserving all existing props:
1. `src/components/marketplace/TripCard.tsx`
2. `src/components/marketplace/LiveTripCard.tsx`
3. `src/components/marketplace/BundleCard.tsx`
4. `src/components/marketplace/ItineraryGuideCard.tsx`
5. `src/components/TopToursCarousel.tsx`
6. `src/pages/HomePage.tsx`

### Out of scope
- No query/data changes
- No changes to avatars, logos, or other `<img>` elements
- No visual redesign