

# Wire Search Bar to Unsplash API

## Problem
The search bar only filters the pre-loaded local media library images client-side. It needs to call the existing `unsplash-search` edge function to pull fresh photos from Unsplash when users type a query or click a mood filter.

## Changes — `src/components/storyboards/TravelStoryboard.tsx`

### 1. Add debounced Unsplash search
- Add a `useEffect` that watches `searchQuery` (debounced ~400ms) and `activeMoods`
- When either has a value, call the `unsplash-search` edge function via `supabase.functions.invoke("unsplash-search", { body: { q } })`
- For mood pills with no text search, use the mood name as the query (e.g. `q: "luxury travel"`)
- Map Unsplash results to the `StoryboardImage` shape: `id` from Unsplash photo id, `url` from `urls.regular`, `thumbnail_url` from `urls.small`, `label` from `description` or `alt_description`
- Store Unsplash results in a new `unsplashResults` state
- Show Unsplash results **above** local library results, with a subtle "From Unsplash" label divider

### 2. Combine results display
- When search/mood is active and Unsplash results exist, render those first in the masonry grid
- Keep the local `filteredImages` below as a secondary section with a "From your library" divider
- When search is empty and no moods active, show only local library (current behavior)

### 3. Loading state for search
- Add a `searching` boolean state for Unsplash fetch in-progress
- Show a subtle inline spinner or shimmer row while Unsplash results load

### 4. Unsplash attribution
- Add small "Photos by Unsplash" text link at bottom of Unsplash results per their API guidelines

| Change | Detail |
|--------|--------|
| New state: `unsplashResults`, `searching` | Hold Unsplash API results |
| New `useEffect` with debounce | Trigger Unsplash search on query/mood change |
| Map Unsplash response → `StoryboardImage` | Normalize data shape |
| Split grid into Unsplash + local sections | Show external results prominently |
| Attribution link | Unsplash API requirement |

Single file change: `src/components/storyboards/TravelStoryboard.tsx`

