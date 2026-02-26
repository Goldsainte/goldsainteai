

# Elevate My Storyboards Page to Match Marketplace Aesthetic

## File: `src/pages/TikTokLab/StoryboardsPage.tsx`

### 1. Header typography — scale up to match marketplace
- Gold label: `text-[10px]` → `text-xs` with same tracking
- Title `h1`: `text-xl md:text-2xl` → `text-2xl md:text-3xl` + add `font-secondary` (Playfair Display serif)
- Subtitle "Plan visually...": `text-sm` → `text-base font-secondary`
- Description paragraph: `text-xs` → `text-sm`
- Explainer link: `text-[11px]` → `text-xs`

### 2. CTA button — refine placement
- Move the "Start a Trip Board" button to sit inline with the header title row (flex row on desktop, stacked on mobile) instead of floating below the explainer link
- Use the same pill style but ensure proper spacing: `px-6 py-3` for more visual weight

### 3. Tabs — elevate styling
- Tab triggers: `text-xs` → `text-sm` with proper padding
- Match the marketplace pill-tab style: `rounded-full border border-[#E5DFC6] bg-white p-1` inline-flex container
- Privacy note: `text-[11px]` → `text-xs`

### 4. Storyboard cards — match marketplace trip cards
- Grid: keep `md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` (same as marketplace)
- Image aspect ratio: keep `aspect-[4/3]` but add white card wrapper with `bg-white rounded-2xl border border-[#E5DFC6] overflow-hidden shadow-sm hover:shadow-md transition-shadow`
- Card title: `text-sm md:text-[15px]` → `font-secondary text-base` (serif, larger)
- Description: `text-[13px]` → `text-sm`
- Edited timestamp: `text-[11px]` → `text-xs`
- Tags: `text-[9px]` → `text-[11px]`
- Item count badge: `text-[10px]` → `text-xs`
- Draft badge: `text-[10px]` → `text-xs`
- "Post to Marketplace" link: `text-[11px]` → `text-sm`
- Move metadata inside card padding (`p-4`) below the image, matching marketplace cards

### 5. Empty state — refine
- Icons: slightly smaller, more restrained
- Title: add `font-secondary` serif
- Description: `text-sm` → `text-base`
- "or browse inspiration" link: `text-[11px]` → `text-sm`

### Summary
Single file change. All modifications are styling/typography — no logic, routing, or data changes. The goal is consistent font sizes, card structure with white card wrappers, serif headers, and proper spacing to match the marketplace's Farfetch × Mr & Mrs Smith aesthetic.

