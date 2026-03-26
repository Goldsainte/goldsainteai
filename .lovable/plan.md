

## Infinite Refinement Discovery — Replace Fixed Hierarchy with Dynamic Path

### Problem
The current system has a rigid 2-level hierarchy: top category → fixed subcategory. The user wants unlimited depth where every click appends to a refinement path and the system generates contextual next-step pills dynamically.

### Design

Replace the fixed `CategoryChips` → `SubcategoryChips` pattern with a **refinement path** model:

```text
Row 1: Top categories (always visible, resets path on change)
Row 2: Contextual refinement pills (generated from current path)
Row 3: Active path breadcrumb chips (removable, shows current refinement)
```

Each pill click appends to a `refinementPath: string[]` array. The Unsplash query is built by joining the entire path. Contextual pills for row 2 are generated based on what the user has selected so far — not from a fixed map.

**Example flow:**
- Click "Luxury Escapes" → path: `["luxury escapes"]`
- Row 2 shows: Beach Villas, Private Islands, Safari Lodges, Desert Resorts...
- Click "Beach Villas" → path: `["luxury escapes", "beach villas"]`
- Row 2 evolves to: Maldives, Bali, Amalfi Coast, Sunset, Overwater...
- Click "Maldives" → path: `["luxury escapes", "beach villas", "maldives"]`
- Row 2 evolves to: Sunset, Private Dining, Underwater, Honeymoon...
- Query: `"luxury escapes beach villas maldives travel"`

### Changes

**1. `src/components/ui/CategoryChips.tsx`** — Add refinement pill data

Add a `REFINEMENT_SUGGESTIONS` map that provides contextual next-step pills based on the current path depth and content. Structure:
- Level 0 (after top category): use existing `SUBCATEGORIES` map
- Level 1+ (after subcategory): a new `DEEP_REFINEMENTS` map keyed by subcategory, providing location/mood/style pills like `"Maldives"`, `"Sunset"`, `"Private"`, `"Overwater"`
- Level 2+: generic travel mood/style pills like `"Golden Hour"`, `"Secluded"`, `"Romantic"`, `"Aerial View"`, `"Local Culture"`

Export a `getRefinementSuggestions(path: string[]): string[]` function that returns the next set of contextual pills based on the current refinement path.

**2. `src/components/discovery/RefinementChips.tsx`** — New component

A single component replacing the fixed subcategory row:
- Takes `refinementPath: string[]` and `onAddRefinement / onRemoveLast / onReset`
- **Row 1**: Always shows top-level category pills (same as current `CategoryChips`)
- **Row 2**: Shows contextual refinement suggestions from `getRefinementSuggestions(path)` — these evolve with each click
- **Row 3**: Shows the active refinement path as removable breadcrumb chips (click × to pop back to that point)
- Max 2-3 visible rows; row 2 replaces itself on each click

**3. `src/hooks/useDiscoveryFeed.ts`** — Update query builder

Change `buildQuery` to accept a flat `refinementPath: string[]` instead of separate category/subcategory. Query = path segments joined with spaces + "travel". The `useDiscoveryFeed` hook signature changes to `useDiscoveryFeed(refinementPath: string[], tags: string[], enabled: boolean)`.

**4. `src/components/creator/CreatorPinterestFeed.tsx`** — Wire up refinement

Replace `activeCategory` + `activeSubcategory` state with a single `refinementPath: string[]`. Wire the new `RefinementChips` component. The "More Like This" action appends image-derived tags to the path. Board filter pills remain unchanged below the refinement rows.

**5. `src/components/discovery/DiscoveryFeed.tsx`** — Update props

Change `category` + `subcategory` props to accept `refinementPath: string[]`. Pass through to `useDiscoveryFeed`. The rest of the component (masonry grid, save modal, infinite scroll) stays the same.

### Refinement Data Structure

```ts
// After subcategory selection, suggest locations/moods
const DEEP_REFINEMENTS: Record<string, string[]> = {
  "Beach Villas": ["Maldives", "Bali", "Amalfi Coast", "Caribbean", "Sunset", "Overwater", "Private Pool"],
  "Private Islands": ["Fiji", "Seychelles", "Caribbean", "Tropical", "Barefoot Luxury"],
  "Street Food": ["Bangkok", "Tokyo", "Mexico City", "Istanbul", "Night Market"],
  "Honeymoon": ["Maldives", "Santorini", "Bora Bora", "Tuscany", "Sunset", "Private"],
  // ... for each subcategory
};

// Generic mood/style pills for depth 2+
const MOOD_REFINEMENTS = ["Golden Hour", "Secluded", "Romantic", "Aerial View", "Vibrant", "Minimalist", "Dramatic", "Cozy", "Wild", "Serene"];
```

### Files

| Action | File | Purpose |
|--------|------|---------|
| Edit | `src/components/ui/CategoryChips.tsx` | Add `DEEP_REFINEMENTS`, `MOOD_REFINEMENTS`, export `getRefinementSuggestions()` |
| Create | `src/components/discovery/RefinementChips.tsx` | Dynamic refinement pill rows with path breadcrumbs |
| Edit | `src/hooks/useDiscoveryFeed.ts` | Accept `refinementPath[]` instead of category+subcategory |
| Edit | `src/components/creator/CreatorPinterestFeed.tsx` | Replace fixed category/subcategory with refinement path |
| Edit | `src/components/discovery/DiscoveryFeed.tsx` | Update props to use refinement path |

