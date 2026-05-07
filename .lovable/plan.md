# Refresh "Why Goldsainte" Differentiation Section

Single-file content update to `src/components/home/TwoWaysComparison.tsx`. No structural, styling, or layout changes — only swap heading, subheadline, card titles/subtitles, checklist items, and CTA labels.

## What changes

### Section header
- Pill: keep `Why Goldsainte`
- Heading: `Why Goldsainte Feels Different` (replaces "Two Distinct Ways to Design Your Journey")
- Subheadline: `Discover, book, or create curated travel experiences with creators and certified travel experts—all in one AI-powered marketplace.`

### Left card — replaces "Travel Marketplace"
- Title: `Discover & Book`
- Subtitle: `Explore curated trips designed by creators and certified travel experts.`
- Checklist (replaces `marketplaceFeatures`):
  1. Browse premium travel experiences from around the world
  2. Book complete itineraries instantly
  3. Compare personalized travel proposals side-by-side
  4. Collaborate directly with creators and travel experts
  5. Transparent pricing and seamless booking
  6. AI-powered recommendations tailored to your travel style
- CTA: `Explore Curated Trips` → `/marketplace` (unchanged route)

### Right card — replaces "Storyboarding"
- Title: `Create & Personalize`
- Subtitle: `Turn inspiration into fully customized travel experiences.`
- Checklist (replaces `storyboardingFeatures`):
  1. Save travel inspiration visually in one place
  2. Upload content and generate itineraries with AI
  3. Customize destinations, pacing, and experiences
  4. Submit dream trips for creator and agent proposals
  5. Collaborate and refine every detail before booking
  6. Designed specifically for travel—not generic planning boards
- CTA: `Start Planning Your Journey` → `/storyboards` (unchanged route)

### Cross-sell tagline (bottom italic line)
Update to align with new framing: `Not sure where to begin? Start with inspiration — your ideas can become a fully booked journey.`

## What stays the same
- Two-column grid, "or" divider, numbered 01/02 badges
- Gold accent bar, cream `#FDF9F0` cards, hover lift, shimmer CTA
- Check-icon checklist with alternating row background
- Pill, gold hairline divider, `font-secondary` heading, `max-w-2xl` subtitle
- Section padding, background, and spacing
- Routes (`/marketplace`, `/storyboards`)

## Out of scope
- No changes to ordering on `Index.tsx` (Why Goldsainte stays after Storyboards Highlight)
- No new icons, animations, or component restructuring
- No edits to `HowGoldsainteWorksSection`
