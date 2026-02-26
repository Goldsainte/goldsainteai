

# My Proposals Dashboard for Agents & Creators

## Overview

Create a new page at `/my-proposals` that shows all proposals the current user has submitted across all trips, with status filtering, search, and quick navigation to each proposal detail.

## Current State

- Proposals are only viewable per-trip via `/proposals?tripId=X` (ProposalsForTripPage)
- There is no cross-trip view for agents/creators to see all their submitted proposals
- The `proposalsService.ts` has `getProposalsForTrip()` but no "get my proposals" function
- The existing `ProposalCard` component in `ProposalsForTripPage.tsx` can serve as a design reference

## Changes

### File 1: `src/services/proposalsService.ts`

Add a new function `getMyProposals()` that:
- Gets the current authenticated user
- Queries `trip_proposals` filtered by `proposer_id = user.id`
- Joins trip request data (title, destination, start_date, end_date) via a separate query on `trip_requests`
- Returns an extended list item type that includes trip context (destination, dates, title)
- Orders by `created_at` descending

New type `MyProposalListItem` extends `ProposalListItem` with:
- `trip_title: string | null`
- `trip_destination: string | null`
- `trip_start_date: string | null`
- `trip_end_date: string | null`

### File 2: `src/pages/proposals/MyProposalsPage.tsx` (NEW)

New page with:

**Header section** — cream background matching existing pages:
- "My Proposals" title
- Subtitle: "All proposals you've submitted across trips"
- Back button to marketplace

**Status filter tabs** — using existing `Tabs` component:
- All | Sent | Accepted | Declined | Withdrawn | Expired
- Each tab shows a count badge
- Filters the list client-side

**Proposal cards list** — each card shows:
- Headline (or "Trip Proposal" fallback)
- Trip destination + dates (the trip context, which ProposalsForTripPage doesn't show)
- Price
- Status badge with human-readable label
- Sent date + valid until
- Click navigates to `/proposals/:id`

**Empty states** — per-tab empty messages:
- "All" tab: "You haven't submitted any proposals yet"
- Filtered tabs: "No {status} proposals"

Design follows existing Goldsainte luxury patterns: cream hero, gold accents, rounded cards, serif headings.

### File 3: `src/routes/AppRoutes.tsx`

Add route:
```
<Route path="/my-proposals" element={<RequireAuth><MyProposalsPage /></RequireAuth>} />
```

Add lazy import for `MyProposalsPage`.

### File 4: Navigation updates

Add "My Proposals" link to the agent/creator navigation areas. Search for where agent-specific nav items exist (sidebar or header) and add the link there, gated by `hasAgentAccess || hasCreatorAccess`.

## Files Modified

| File | Action |
|------|--------|
| `src/services/proposalsService.ts` | Add `MyProposalListItem` type + `getMyProposals()` function |
| `src/pages/proposals/MyProposalsPage.tsx` | New page — proposals dashboard with status tabs and card list |
| `src/routes/AppRoutes.tsx` | Add `/my-proposals` route with lazy import |
| Navigation component (Header/Sidebar) | Add "My Proposals" link for agents/creators |

No database changes needed — all data already queryable via existing `trip_proposals` table with RLS.

