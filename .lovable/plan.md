

# Redesign Trip Request Cards to Match Airbnb-Style LiveTripCard

## Problem
The Trip Request cards in the marketplace (`TripRequestGrid.tsx`) use a bordered card container with a gradient overlay on images and boxed content — visually different from the clean, minimal Airbnb-style layout used by the "Ready to Book" cards (`LiveTripCard.tsx`).

## Solution
Restyle `TripRequestGrid.tsx` to match the `LiveTripCard` pattern: no card border/container, clean rounded image (aspect-[4/3]), content below with `font-secondary` serif title, `text-[#6B7280]` metadata, and no gradient overlay on the image.

### File: `src/components/marketplace/TripRequestGrid.tsx`

**Changes:**
- Remove the bordered card wrapper (`border border-[#E5DFC6]/40 bg-white shadow-sm`) — use a clean `group cursor-pointer space-y-2.5` container like LiveTripCard
- Image: switch from `h-40` to `aspect-[4/3]` with `rounded-xl md:rounded-2xl`, remove the dark gradient overlay
- Destination: move from an overlay pill on the image to a `text-[13px] text-[#6B7280]` line below the title with `MapPin` icon (matching LiveTripCard)
- Title: use `font-secondary text-sm md:text-[15px] text-[#0a2225] font-medium` matching LiveTripCard
- Remove the description paragraph (LiveTripCard doesn't show descriptions)
- Budget and date: use the same `text-[13px] text-[#6B7280]` style with small icons, matching LiveTripCard's metadata lines
- Grid: switch to `gap-x-6 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4` to match LiveTripGrid

### Technical Detail
The card structure will mirror `LiveTripCard` exactly:
```
article (space-y-2.5, no border)
  └─ div (aspect-[4/3], rounded-xl, overflow-hidden)
      └─ img (clean, no gradient overlay)
  └─ div (space-y-1, px-0.5)
      └─ h3 (font-secondary, title + budget on same row)
      └─ p (MapPin + destination)
      └─ p (Calendar + posted date)
```

## Files Modified (1 file)
- `src/components/marketplace/TripRequestGrid.tsx`

