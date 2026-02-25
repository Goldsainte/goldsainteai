

# Airbnb-Style Card Redesign for "Choose How You Join" Section

## Current State
The role cards use a fixed-height image (`h-44`) with a dark gradient overlay and an icon badge overlaid on the image. This is the same editorial pattern we already replaced in the marketplace and Curated Journeys sections.

## Changes

### File: `src/components/home/RoleSpecificCTAs.tsx`

1. **Image aspect ratio**: Replace `h-44` with `aspect-[4/3]` for consistent landscape ratio matching marketplace cards
2. **Remove gradient overlay**: Delete the `bg-gradient-to-t from-black/40` div
3. **Remove icon overlay from image**: Move the role icon out of the image area and into the metadata section below
4. **Clean image**: Image becomes a clean, unobstructed photo with rounded corners and hover scale effect
5. **Restructure content below image**: Icon + title on same row, body text, then CTA button — cleaner visual hierarchy
6. **Card styling**: Remove border, use lighter shadow approach matching marketplace cards (rounded-xl, no border, subtle shadow)

### Card structure after change:
```text
┌─────────────────────┐
│                     │
│   Clean image 4:3   │
│   (no overlay)      │
│                     │
├─────────────────────┤
│ 🔵 Title            │
│ Description text    │
│ [CTA Button]       │
│ Browse link         │
└─────────────────────┘
```

No other files affected.

