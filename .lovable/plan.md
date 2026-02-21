

# Simplify Hero CTAs

## What Changes
Replace the current 4-button layout (Post a dream trip, Browse creators, Browse agents, Marketplace) with two focused CTAs:

- **Primary:** "Create Your Travel Storyboard" (full-width, dark green)
- **Secondary:** "See How It Works" (full-width, outlined)

## Why
- Reduces decision paralysis from 4 choices to 2
- Focuses the hero on the core action (storyboard creation)
- "See How It Works" scrolls or links to the how-it-works section for users not yet ready to commit
- Browse creators/agents remain accessible via the navigation and other page sections

## Technical Details

**File: `src/components/home/HomeHero.tsx` (lines 47-74)**

Replace the entire CTA block (3 rows, 4 buttons) with:

```
<div className="flex flex-col gap-3 pt-1 max-w-sm">
  <Link to="/post-trip" className="... bg-[#0c4d47] ...">
    Create Your Travel Storyboard
  </Link>
  <a href="#how-it-works" className="... border border-[#BFAD72] bg-white ...">
    See How It Works
  </a>
</div>
```

The secondary CTA will use an anchor link (`#how-it-works`) to smooth-scroll to the How Goldsainte Works section on the same page. An `id="how-it-works"` will be added to the corresponding section wrapper.

**File: `src/i18n/locales/en.json`**

- Update `postDreamTrip` key to "Create Your Travel Storyboard"
- Add a new `seeHowItWorks` key with value "See How It Works"
- The `browseCreators`, `browseAgents`, and `marketplace` keys can remain for use elsewhere

**File: `src/sections/HomeLuxurySections.tsx`**

- Add `id="how-it-works"` to the HowGoldsainteWorksSection wrapper element so the anchor link lands correctly
