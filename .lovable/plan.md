

# Infinite Rotating Inspiration Carousel for Post a Trip Step 4

## Problem
The current "browse curated inspiration" section in Step 4 renders a static masonry grid of 24 images fetched once from the media library. The user wants this to feel like an endlessly rotating stream of thousands of food, travel, luxury, and vacation photos that the traveler can browse and tap to add.

## Approach
Replace the static `TravelStoryboard` masonry grid in Step 4 with a new `InspirationCarousel` component — a horizontally auto-scrolling strip of photo cards that:

1. **Fetches in pages** from `storyboard_media_library` (e.g. 50 images per batch), loading more as the user scrolls or as the carousel loops
2. **Auto-scrolls continuously** like a ticker/marquee, pausing on hover so users can tap
3. **Shows multiple rows** (2 rows of horizontal scroll) to maximize density
4. **Renders thousands over time** by paginating with random offset ordering so each session feels fresh
5. Tapping a photo still calls the existing `storyboardAddItemRef.current?.(...)` to add it to the builder

## Changes

### 1. New component: `src/components/storyboards/InspirationCarousel.tsx`
- Two horizontal rows of portrait-aspect photo cards auto-scrolling in opposite directions (top row left, bottom row right) for visual richness
- Uses CSS `@keyframes` marquee animation on the row containers for smooth infinite scroll
- Pauses animation on hover (`[&:hover]` sets `animation-play-state: paused`)
- Each image is a clickable card — on tap, fires `onImageClick(image)`
- Loads images from `storyboard_media_library` with `mood_tags` filtering for luxury aesthetic
- Fetches 100+ images, splits into two rows, duplicates each row's content to create seamless loop illusion
- Random ordering (`order` by random seed) so every page load shows different sequence

### 2. Edit: `src/pages/trips/PostTripPage.tsx` (lines 551-577)
- Replace the `TravelStoryboard` import and usage with the new `InspirationCarousel`
- Keep the same `onImageClick` handler wiring
- Update the header text to something like "Browse thousands of curated photos — tap to add"

### 3. Edit: `tailwind.config.ts`
- Add `scroll-left` and `scroll-right` keyframe animations for the marquee effect:
  - `scroll-left`: `translateX(0)` → `translateX(-50%)` (since content is doubled)
  - `scroll-right`: `translateX(-50%)` → `translateX(0)`
- Duration ~60s for smooth, leisurely pace

## How it works visually

```text
┌──────────────────────────────────────────────┐
│  ← ← ← Row 1 scrolling left  ← ← ←        │
│  [img][img][img][img][img][img][img]...       │
│                                              │
│  → → → Row 2 scrolling right → → →          │
│  [img][img][img][img][img][img][img]...       │
└──────────────────────────────────────────────┘
  Hover pauses. Tap any image → added to builder.
```

Each row contains ~50 images duplicated (so 100 DOM nodes per row), creating a seamless infinite loop via CSS animation. Two rows scrolling opposite directions creates a dynamic, living gallery feel. Portrait aspect cards (`aspect-[3/4]`, ~120px wide) keep it compact in the wizard.

## What stays the same
- The `TravelStoryboard` component itself is untouched (used elsewhere)
- The `storyboardAddItemRef` wiring and item format stay identical
- The StoryboardBuilder above remains unchanged

