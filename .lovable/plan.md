
# Update Hero Headline

## What Changes
Replace the current hero headline with the suggested alternative that includes both creators and agents:

**Current:** "Where inspiration becomes a storyboard -- and the perfect creator + agent team builds the trip."

**New:** "Turn Your Travel Vision Into a Storyboard -- Then Let Creators & Agents Compete to Bring It to Life."

## Technical Details

Two files need updating:

**1. `src/components/home/HomeHero.tsx` (lines 32-35)**
The headline is hardcoded in the component with `<em>` tags for italic styling. Replace with the new text, applying `<em>` tags to key phrases for visual consistency (e.g., "Storyboard", "Creators & Agents").

**2. `src/i18n/locales/en.json` (line 75)**
Update the `mainHeadline` translation key to match the new text.
