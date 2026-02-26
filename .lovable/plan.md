

# Update "Why Goldsainte" Section Copy & Features

## Changes — `src/components/home/TwoWaysComparison.tsx`

### 1. Update heading and subtitle (lines 70–75)

- **Heading:** "Two Distinct Ways to Design Your Journey"
- **Subtitle:** "Whether you want expert-crafted precision or prefer to shape your vision first, Goldsainte gives you a seamless path forward."

### 2. Replace marketplace features (lines 4–15)

New list (6 items instead of 10):
- Receive custom trip concepts tailored to your style
- Collaborate with vetted creators & certified travel advisors
- Compare personalized proposals side-by-side
- Transparent pricing and secure booking
- Built-in messaging for effortless collaboration
- From vision to confirmed booking — all in one place

### 3. Replace storyboarding features (lines 17–28)

New list (6 items):
- Save hotels, experiences, and inspiration in one place
- Shape your aesthetic with visual planning
- Turn ideas into a structured travel brief
- Guide creators and agents with clear direction
- Refine and edit before sharing
- Designed specifically for travel — not generic boards

### 4. Add descriptive subtitle to each card

Update `FeatureCard` to accept an optional `subtitle` prop displayed below the title and gold divider:
- Marketplace: "For travelers who want experts to design the experience."
- Storyboarding: "For travelers who want to define the vibe before committing."

### 5. Update button labels (line 77–78)

- Marketplace: "Explore Expert-Designed Trips"
- Storyboarding: "Start Your Storyboard"

### 6. Add arrow prefix to button text

Prepend "→ " to each button label for the directional feel requested, or use a small ArrowRight icon inline.

Single file, copy-only changes. No logic or routing changes.

