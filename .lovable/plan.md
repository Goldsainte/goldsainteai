
# Move "How Goldsainte AI Works" Directly Below the Hero

## What Changes
Reorder the homepage so the "How Goldsainte AI Works" section appears immediately after the Hero, before Storyboards Highlight. This ensures first-time visitors instantly understand *what* Goldsainte AI does before seeing the marketplace details.

**Current order:**
1. Hero
2. Storyboards Highlight
3. Built for Every Side
4. How Goldsainte AI Works
5. Role-Specific CTAs
6. Trust, Safety and Payments

**New order:**
1. Hero
2. How Goldsainte AI Works
3. Storyboards Highlight
4. Built for Every Side
5. Role-Specific CTAs
6. Trust, Safety and Payments

## Why
- The "See How It Works" CTA in the hero now anchors directly to this section — placing it immediately below creates a seamless scroll experience
- Users understand the AI value proposition before diving into marketplace details
- The existing copy is strong and already in place: *"Goldsainte AI listens to your style, curates the right creators and certified agents, and quietly orchestrates the journey in the background..."*

## Technical Details

**File: `src/pages/Index.tsx`**

Move `<HowGoldsainteWorksSection />` from its current position (after `BuiltForEverySideSection`) to directly after `<HomeHero />`, before `<StoryboardsHighlight />`.

**File: `src/pages/HomePage.tsx`**

Same reorder — move `<HowGoldsainteWorksSection />` to right after `<HomeHero />`.

No content or styling changes needed — purely a section reorder in both page files.
