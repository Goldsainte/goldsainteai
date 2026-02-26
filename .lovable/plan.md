

# Redesign Trip Request Detail Page + Route to Proposal Workspace

## Problem

The `/marketplace/request/:id` page (`src/pages/marketplace/TripRequestDetail.tsx`, 842 lines) is the page you're seeing. It has all the problems you described:
- The inline proposal form is buried below a long trip brief scroll
- Multiple competing CTAs ("Jump to Proposal Form", sidebar "Submit a Proposal", bottom green button)
- Beige-on-beige, visually dense, no clear separation between viewing and bidding
- No value pitch area — just price/timeline fields
- The "Submit Proposal" buttons scroll to an inline form instead of navigating to the dedicated workspace we already built

## What Changes

### 1. Remove Inline Proposal Form from Trip Request Detail Page

**File:** `src/pages/marketplace/TripRequestDetail.tsx`

- **Remove** the entire inline `ProposalWizard` form section (lines ~662-716) and the "Jump to Proposal Form" CTA card (lines ~578-596)
- **Replace** all "Submit Proposal" buttons (sidebar CTA at line 782, inline CTA) with a single navigation action: `navigate(\`/proposals/new?tripId=${request.id}\`)`
- This makes the trip detail page purely a **listing view** — clean, scannable, no form clutter

### 2. Clean Up Visual Hierarchy on Listing Page

- Change background from `bg-[#f7f3ea]` to `bg-white` for the main content area below the hero
- Replace thin beige borders with subtle shadows on cards
- Remove the user profile card that shows before the form (no longer needed — profile shows in the workspace)
- Keep: hero, trip brief card, vibe tags, must-haves/dealbreakers, visual brief, sidebar (posted by, trip details, budget, how it works)

### 3. Single Primary CTA

- One bold CTA in the sticky sidebar: "Submit Your Proposal" → navigates to `/proposals/new?tripId=...`
- On mobile: sticky bottom bar with the same CTA
- Remove all duplicate scroll-to-form buttons

### 4. Add Competitive Context to Sidebar

- Show proposal count ("X proposals submitted") in the sidebar
- Show "Be the first to propose" if count is 0
- This data is already fetched (`proposalsCount` state)

### Files Modified

| File | Action |
|------|--------|
| `src/pages/marketplace/TripRequestDetail.tsx` | **Major edit** — remove inline form, clean up CTAs, update visual hierarchy, add competitive context to sidebar |

No new files needed. The proposal workspace at `/proposals/new` already exists and works.

