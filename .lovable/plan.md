

# Simplify Curated Journeys CTAs to Single Button

## What Changes
Replace the two buttons ("Start a storyboard with Madison" and "Explore the Creator & Travel Agent Marketplace Collection") with a single primary CTA: **"Explore All Curated Journeys"**.

## Why
- Two buttons create unnecessary decision fatigue under a browse-oriented section
- "Explore All Curated Journeys" is a natural next step after seeing the trip tiles
- The Madison/concierge CTA lives in the hero already, so it doesn't need to repeat here
- Keeps the section focused: see trips, want more, click one button

## Technical Details

**File: `src/components/home/StoryboardsHighlight.tsx` (lines 139-155)**

Replace the two-button flex container with a single centered primary button:

```tsx
<div className="flex justify-center">
  <Button
    asChild
    size="lg"
    className="bg-[#0c4d47] text-[#E5DFC6] hover:bg-[#073331] shadow-sm"
  >
    <Link to="/marketplace">
      {t('home.storyboards.exploreAll')}
    </Link>
  </Button>
</div>
```

**File: `src/i18n/locales/en.json`**

Add a new key inside `home.storyboards`:
- `"exploreAll": "Explore All Curated Journeys"`

The existing `startWithMadison` and `exploreStoryboards` keys can remain for potential use elsewhere.

