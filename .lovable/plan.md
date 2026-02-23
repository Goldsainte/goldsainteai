

# Redesign My Trips + Marketplace Cards to Match Airbnb-Style Layout

## Two Issues to Address

### 1. Navigation to My Trips
"My Trips" is currently accessible via the profile dropdown menu in the header (for travelers). This is the correct pattern and mirrors how Airbnb handles "Trips" -- it lives in the user menu, not as a top-level nav item. No changes needed here.

### 2. Card Design Overhaul (Both Pages)

**Current problems:**
- **Marketplace cards** use a very tall `aspect-[4/5]` image ratio making them massive -- more like magazine covers than browse-able listings
- **My Trips request cards** are plain text rows with no images at all -- they look like a spreadsheet, not a travel platform
- Neither matches the compact, scannable Airbnb grid pattern shown in the reference

## The Plan

### A. Marketplace LiveTripCard -- Make Compact Like Airbnb

Change the card layout from tall editorial cards to compact Airbnb-style cards:
- Reduce image aspect ratio from `aspect-[4/5]` to `aspect-[4/3]` (landscape, not portrait)
- Remove the dark gradient overlay on images -- Airbnb keeps images clean
- Move title, location, and price BELOW the image (not overlaid on it)
- Keep the price badge and duration badge but style them more subtly
- Remove the "Curator credit" line to keep cards lean
- Grid changes from 3 columns to 4 columns on large screens (`lg:grid-cols-4`)

**File:** `src/components/marketplace/LiveTripCard.tsx`
**File:** `src/components/marketplace/LiveTripGrid.tsx` (grid columns)

### B. My Trips Request Cards -- Add Visual Identity

Transform the plain text `TripRequestRow` into a visual card with:
- A destination placeholder image (gradient or stock based on destination name)
- Compact card layout: image on left (small square ~100px), details on right
- Or grid layout similar to Airbnb: small square image on top, details below
- Keep status badge, destination, dates, travelers, budget, and proposal count
- Keep the delete button and "View brief" link
- Use the same compact card proportions as the new marketplace cards

**File:** `src/pages/trips/MyTripsPage.tsx` (TripRequestRow component)

### C. Grid Layout Consistency

Both pages should use a responsive multi-column grid:
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3-4 columns

This replaces the current stacked list layout on My Trips.

## Technical Details

### Files Changed

| File | Change |
|------|--------|
| `src/components/marketplace/LiveTripCard.tsx` | Reduce image to `aspect-[4/3]`, move title/price below image, remove gradient overlay, cleaner Airbnb-style layout |
| `src/components/marketplace/LiveTripGrid.tsx` | Change grid to `sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4` |
| `src/pages/trips/MyTripsPage.tsx` | Redesign `TripRequestRow` as a visual card with destination-based gradient/placeholder image, switch requests list from vertical stack to responsive grid |

### Design Tokens Preserved
- Cream background, white cards, `#E5DFC6` borders
- Gold accents, dark teal CTAs
- Serif headers via `font-secondary`
- Rounded corners, soft shadows

