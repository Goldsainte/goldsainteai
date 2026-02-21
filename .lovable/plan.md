

# Update "How Goldsainte AI Works" Description Copy

## What Changes
Update the description paragraph in the "How Goldsainte AI Works" section.

**Current:**
"Goldsainte AI listens to your style, curates the right creators and certified agents, and quietly orchestrates the journey in the background — while you stay in the experience. From mood board to booking confirmation, every step feels effortless."

**New:**
"Goldsainte transforms your travel ideas into a structured storyboard, then intelligently matches it within our curated marketplace of expert agents and creators. They compete to design and price your journey — while our AI streamlines the process from inspiration to booking."

## Why
- Shifts from abstract/poetic language to concrete value proposition
- Introduces the competitive marketplace concept (agents/creators compete)
- Explains the actual product flow: ideas to storyboard to marketplace matching to booking

## Technical Details

Two files need updating:

**File: `src/sections/HomeLuxurySections.tsx` (line 340)**
Replace the hardcoded paragraph text with the new copy.

**File: `src/i18n/locales/en.json` (line 127)**
Update the `home.howItWorks.description` key with the new copy (for i18n consistency, even though the section currently uses hardcoded text).

