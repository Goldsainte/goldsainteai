

## Improve Text Readability Across Discovery Section

### Problem
Multiple elements use `text-xs` (12px) which is too small for comfortable reading, especially the section headers ("EXPLORE TRAVEL IDEAS", "FROM MY TRAVELS"), description text, refinement chips, board filter labels, and the instruction bar. The screenshots confirm these are hard to read.

### Changes

**1. `src/components/discovery/RefinementChips.tsx`**
- Refinement suggestion pills: `text-xs` → `text-sm` (line 48)
- Active path breadcrumb pills: `text-xs` → `text-sm` (line 62)
- "Clear all" button: `text-xs` → `text-sm` (line 76)

**2. `src/components/ui/CategoryChips.tsx`**
- Subcategory pills: `text-xs` → `text-sm` (lines 255, 268)
- Top category pills already use `text-sm` — no change needed

**3. `src/components/creator/CreatorPinterestFeed.tsx`**
- "Your Boards" label: `text-xs` → `text-sm` (line 207)
- Board filter pills: `text-xs` → `text-sm` (lines 214, 226, 240)
- Instruction bar text: `text-xs` → `text-sm` (line 190)
- Instruction bar arrows: `h-3 w-3` → `h-3.5 w-3.5`

### Summary
Bump all `text-xs` instances in the discovery/refinement/board UI to `text-sm` (14px) for better readability while keeping the design compact and elegant. No layout or structural changes.

