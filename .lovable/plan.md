

# Add CTA Pill Buttons to "Why Goldsainte" Section

## Overview

Add a pill-style CTA button beneath each feature card in the `TwoWaysComparison` component — one linking to `/marketplace` and one linking to `/storyboards`.

## Changes

### File: `src/components/home/TwoWaysComparison.tsx`

1. Import `Link` from `react-router-dom`.

2. Update the `FeatureCard` component to accept optional `linkTo` and `linkLabel` props. Render a pill-style `Link` button below the feature list, styled consistently with the existing design system (rounded-full, GS green background `#0c4d47`, gold/cream text `#E5DFC6`, hover state).

3. Pass the following to each card:
   - **Travel Marketplace** card: `linkTo="/marketplace"` / `linkLabel="Explore the Marketplace"`
   - **Storyboarding** card: `linkTo="/storyboards"` / `linkLabel="Create a Storyboard"`

### Visual Style

The pill buttons will match the existing site aesthetic — rounded-full, compact padding, centered below each card's feature list. Same treatment as the hero CTAs.

