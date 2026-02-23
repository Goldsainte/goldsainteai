

# Redesign Trip Request Detail as a Proper Marketplace Brief

## The Problem

The current page has layout and spacing issues that make it feel like a blog post rather than a professional three-way marketplace request page (like Fiverr, Upwork, or Bark). Specific issues:

- The full-width storyboard section between the hero and content creates a massive visual gap
- The two-column split is 2/3 + 1/3 which makes the left column feel sparse when there are no proposals
- Excessive vertical padding (py-10, py-14) between sections creates a disconnected feel
- The "Visual Brief" section has verbose editorial copy that belongs on a magazine, not a marketplace
- The proposal form dominates the page even though most visitors are browsing
- The sidebar cards feel like afterthoughts rather than key decision-making elements

## The Redesign

Restructure as a clean, scannable marketplace brief with the Mr and Mrs Smith luxury aesthetic preserved.

### New Layout Structure

```text
+----------------------------------------------------------+
|  HERO (shorter: 280px, tighter overlay)                   |
|  Title + destination/dates/travelers/budget pills          |
+----------------------------------------------------------+
|                                                            |
|  LEFT COLUMN (flex-1, ~60%)    |  RIGHT SIDEBAR (380px)   |
|                                |                           |
|  [Trip Brief card]             |  [Posted By card]         |
|   - Description                |  [Trip Summary card]      |
|   - Special requests           |   - Destination           |
|   - Visual Brief (inline)      |   - Dates                 |
|                                |   - Travelers             |
|  [Proposals section]           |   - Style                 |
|   - Count + CTA               |   - Budget (highlighted)  |
|   - Proposal cards             |  [Submit Proposal CTA]    |
|                                |  [Tips card]              |
|  [Proposal Form]               |                           |
|   (collapsed by default for    |                           |
|    non-owners, visible for     |                           |
|    agents/creators)            |                           |
+----------------------------------------------------------+
```

### Key Changes

1. **Shorter hero** -- reduce from 420px to 280px on desktop; tighter padding
2. **Move storyboard inline** -- the Visual Brief becomes a compact horizontal scroll inside the main "Trip Brief" card, not a full-width section. No verbose editorial copy, just a label and the images
3. **Move description/special requests to main column** -- currently buried in the sidebar, these belong in the main content area as the "brief" itself
4. **Tighter sidebar** -- fixed 380px width, sticky, contains: Posted By, Trip Summary (compact key-value rows), Budget highlight, a "Submit a Proposal" CTA button (scrolls to form), and Tips
5. **Reduce vertical spacing** -- use py-6/py-8 instead of py-10/py-14; gap-6 instead of gap-10
6. **Proposal form** -- keep it in the left column but move it below proposals so the brief + proposals are the primary content

### Files Changed

| File | Change |
|------|--------|
| `src/pages/marketplace/TripRequestDetail.tsx` | Complete layout restructure: shorter hero, inline storyboard, description in main column, tighter spacing, sidebar reorganization, proposal form repositioned |

### Design Tokens Preserved

- Cream background `#f7f3ea`, white cards with `#E5DFC6` borders
- Gold accents `#C7A962`, dark teal `#0c4d47` CTAs
- Serif headers via `font-secondary`
- Rounded-2xl cards with soft shadows
- All existing data fetching and proposal logic unchanged

