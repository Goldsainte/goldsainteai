

# Redesign TripTrustBadges to Match Luxury Aesthetic

## Problem
The `TripTrustBadges` component uses a dark background (`bg-[#0a2225]`) with dark card tiles (`bg-white/5`), creating a heavy, out-of-place section that clashes with the light, airy Farfetch × Mr & Mrs Smith aesthetic used everywhere else on the site.

## Fix
Restyle the component to use the established luxury design tokens: cream background, white cards with subtle gold borders, dark text, and gold accent icons — consistent with `TripTrustFooter` and the rest of the trip detail page.

### File: `src/components/trips/TripTrustBadges.tsx`

**Changes:**
- Outer section: `bg-[#0a2225]` → `bg-[#FDF9F0]` (cream) with `border-[#E5DFC6]` border
- Header text: white → dark `#0a2225` for headline, gold `#C7A962` for subtitle
- Badge cards: `bg-white/5` → `bg-white` with `border border-[#E5DFC6]` and subtle shadow
- Icon circles: `bg-[#C7B892]/20` → `bg-[#C7A962]/15` with `text-[#C7A962]`
- Card titles: `text-white` → `text-[#0a2225]`
- Card descriptions: `text-white/70` → `text-[#6B7280]`
- Users icon + traveler count: `text-[#C7B892]` → `text-[#C7A962]`

This brings the component in line with `TripTrustFooter`, `TripCancellationPolicySection`, and every other section on trip detail pages.

