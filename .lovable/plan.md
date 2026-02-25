

# Merge Inspiration Browsing into Post a Trip (Step 4)

## What you're asking
Right now, the Post a Trip wizard (Step 4 — "Build your visual brief") only shows the `StoryboardBuilder` which requires travelers to **search** for photos or experiences. Separately, the homepage and standalone storyboard pages have a beautiful browsable masonry grid of curated travel inspiration photos (the `TravelStoryboard` component pulling from the media library). You want that browsable inspiration gallery **merged into** the Post a Trip Step 4 so travelers can browse and tap photos to add them to their storyboard without needing to search.

## Changes

### 1. `src/pages/trips/PostTripPage.tsx` — Add inspiration gallery below StoryboardBuilder
- Import `TravelStoryboard` component
- In Step 4 (currentStep === 3), add a new section below the `StoryboardBuilder` titled something like "Browse inspiration" with the `TravelStoryboard` masonry grid
- Wire `onImageClick` so tapping a photo from the gallery adds it to the storyboard builder's items list
- Pass the destination as a highlight tag to surface relevant images first

### 2. `src/components/storyboards/StoryboardBuilder.tsx` — Expose an `addExternalPhoto` method
- Currently photos can only be added via internal Unsplash search results. We need to expose a way for the parent (PostTripPage) to programmatically add a photo item to the builder's `items` state
- Add an `externalAddRef` prop (a `React.MutableRefObject`) that exposes an `addPhoto(url, label)` function, OR
- Simpler approach: accept an `onImageClick` callback pattern where the parent passes clicked images down. Since the builder owns the items state, the cleanest approach is to add an imperative ref that lets the parent push items into the builder

### 3. No standalone storyboard routes removed
The standalone `/storyboards/new` pages stay for agents/creators who use them independently. This change only enhances the traveler Post a Trip flow.

## How it works for the traveler

Step 4 of Post a Trip will now show:
1. The existing `StoryboardBuilder` (search for photos, experiences, paste links) at the top
2. A new "Browse inspiration" section below with the curated masonry grid from `TravelStoryboard`
3. Tapping any photo in the gallery instantly adds it to the storyboard preview above
4. The rest of the flow (auto-save on Next, linking to trip request) stays the same

## Technical detail

The `StoryboardBuilder` component will gain an `addItemRef` prop:
```typescript
addItemRef?: React.MutableRefObject<((item: Item) => void) | null>;
```

The parent (`PostTripPage`) will hold this ref and pass it to `StoryboardBuilder`. When a `TravelStoryboard` image is clicked, the parent calls `addItemRef.current(...)` to inject the photo into the builder's items array. This avoids lifting state out of the builder while still allowing external additions.

