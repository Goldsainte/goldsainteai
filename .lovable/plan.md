

# Elevate the "Why Goldsainte" Comparison Section

The content and messaging are right — it just needs more visual sophistication. Here's the plan to elevate it while keeping the same copy and structure.

## Changes — `src/components/home/TwoWaysComparison.tsx`

### 1. Add a numbered icon badge to each card
Each card gets a small gold-bordered circle with "01" / "02" in the top-left corner, creating a sense of editorial sequencing. This replaces the flat title-only header.

### 2. Add a subtle top accent bar
A thin gold gradient strip along the top edge of each card (via a pseudo-element or a top div), giving them a premium "editorial card" feel.

### 3. Improve card depth and hover interaction
- Add a subtle box shadow (`shadow-md`) at rest
- On hover: slight lift (`hover:-translate-y-1`), increased shadow (`hover:shadow-xl`), and smooth transition
- This adds a tactile, interactive quality

### 4. Style the feature list with a left gold accent border on alternating rows
Instead of just alternating background colors, add a thin left border on the highlighted rows (`border-l-2 border-[#C7A962]`) for a more editorial treatment.

### 5. Add a subtle divider between the two cards
Insert a vertical "or" separator visible on desktop between the two cards — a thin line with a small "or" badge in the center — to reinforce the "two paths" concept.

### 6. Enhance the CTA button
Add a subtle shimmer/glow effect on hover and increase padding slightly for more visual weight. Add an underline-on-hover to the label text for refinement.

### 7. Add a connecting tagline below the cards
A small centered line below the grid:
*"Not sure which path is right? Start with a storyboard — you can always post to the marketplace later."*
This reduces decision anxiety and adds a smart cross-sell.

### Summary of visual upgrades

| Element | Current | Elevated |
|---------|---------|----------|
| Card top | Flat | Gold accent bar |
| Card header | Title only | Numbered badge + title |
| Card depth | Flat border | Shadow + hover lift |
| Feature rows | Alt background | Alt background + gold left border |
| Between cards | Gap only | Vertical "or" divider |
| CTA button | Static | Hover glow + underline |
| Below cards | Nothing | Soft cross-sell tagline |

Single file, styling-only changes. No content or routing modifications.

