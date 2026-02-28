

## Redesign Creator Dashboard to Match Traveler Dashboard Aesthetic

The Creator Dashboard currently looks like a generic stat page. It needs to match the Traveler Dashboard's structure: avatar header with personalized greeting, tabbed navigation with pill-style tabs, and the same editorial Mr & Mrs Smith feel.

### Architecture Change

Restructure from a single flat page into a **tabbed hub** mirroring `TravelerDashboardPage`:

**Tabs:**
1. **Overview** — stat cards + recent proposals + open trip requests banner (current content, reorganized)
2. **Proposals** — full list of all proposals with status filters
3. **My Trips** — creator's published packaged_trips from trip-builder
4. **Earnings** — earnings breakdown (from CommissionDashboard, restyled)
5. **Settings** — creator profile settings, payout preferences

### Implementation Steps

**1. Rewrite `src/pages/CreatorDashboard.tsx` layout**
- Add avatar + personalized header matching Traveler Dashboard pattern: fetch profile, show avatar with `Avatar` component, gold "Creator Studio" label, "Welcome back, [FirstName]"
- Add quick actions row: "Browse Trip Requests" (primary dark CTA), "Create Trip Package" (outline)
- Replace flat content with `Tabs` component using same pill-style `TabsList` as Traveler Dashboard (rounded-full, dark green active state `#0c4d47` with gold text `#bfad72`)
- Mobile: use `Select` dropdown for tab navigation (same pattern as Traveler)
- Remove icon circles from stat cards — use text-only editorial style with gold divider accents per the design standard (no Lucide icons in circles)

**2. Restyle stat cards (editorial, not generic)**
- Remove the `LuxuryStatCard` component with its icon circle pattern
- Replace with minimal editorial stat blocks: large serif number, small uppercase label below, thin gold divider between cards
- Use a horizontal row on desktop (flex), stacked on mobile

**3. Recent Proposals section**
- Keep the proposal list but restyle cards: remove rounded-2xl heavy borders, use subtle bottom border dividers instead (editorial list style)
- Status badge stays, add a thin gold accent line on the left for active proposals

**4. Extract tab content into separate components**
- `src/pages/creator/components/CreatorOverviewTab.tsx` — stats + recent proposals + open requests
- `src/pages/creator/components/CreatorProposalsTab.tsx` — full proposals list (placeholder linking to /my-proposals for now)
- `src/pages/creator/components/CreatorTripsTab.tsx` — packaged trips grid (placeholder)
- `src/pages/creator/components/CreatorEarningsTab.tsx` — earnings view (placeholder)
- `src/pages/creator/components/CreatorSettingsTab.tsx` — settings (placeholder)

### Files to Create
- `src/pages/creator/components/CreatorOverviewTab.tsx`
- `src/pages/creator/components/CreatorProposalsTab.tsx`
- `src/pages/creator/components/CreatorTripsTab.tsx`
- `src/pages/creator/components/CreatorEarningsTab.tsx`
- `src/pages/creator/components/CreatorSettingsTab.tsx`

### Files to Edit
- `src/pages/CreatorDashboard.tsx` — full rewrite to tabbed hub layout

### Design Tokens (consistent with Traveler Dashboard)
- Background: `#FDF9F0`
- Cards: `bg-white border border-[#E5DFC6]`
- Active tab: `bg-[#0c4d47] text-[#bfad72]`
- Inactive tab: `text-[#6B7280]`
- Primary CTA: `bg-[#0a2225] text-white rounded-full`
- Gold accent: `#C7A962`
- Headers: `font-secondary` (Playfair Display)
- No icon circles — editorial typography-first approach

