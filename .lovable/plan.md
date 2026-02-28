

## Rework Creator Dashboard with Relevant Stats

The current dashboard shows "Trip Stories" and "Estimated Earnings" from the edge function, plus a "Recent Stories" section. These are largely irrelevant to the creator's actual marketplace activity (bidding on trips, proposal responses, bookings). Here's the reworked plan.

### New Stats to Display

1. **Active Proposals** — count of `trip_proposals` where `proposer_id = user.id` and `status` in ('pending', 'sent', 'traveler_review')
2. **Accepted Proposals** — count where `status = 'accepted'`
3. **Total Proposals Sent** — lifetime count of all proposals submitted
4. **Response Rate** — percentage of proposals that received a response (accepted + declined) vs total sent
5. **Estimated Earnings** — keep this, sourced from `creator_earnings` table
6. **Pending Earnings** — earnings with `status = 'pending'`

### New Sections

- **Recent Proposals** — replace "Recent Stories" with the last 10 proposals showing headline, destination (from trip_request), status badge, and date
- **Open Trip Requests** — quick count/link to marketplace showing how many open requests match their profile

### Implementation

**1. Update the edge function `creator-dashboard-stats/index.ts`**
- Query `trip_proposals` where `proposer_id = user.id` for proposal counts by status
- Join `trip_requests` for destination info on recent proposals
- Keep earnings queries from `creator_earnings`
- Remove `trip_stories` and TikTok-related queries entirely

**2. Update `src/pages/CreatorDashboard.tsx`**
- Update `CreatorStats` type with new fields: `activeProposals`, `acceptedProposals`, `totalProposalsSent`, `responseRate`, `totalEarnings`, `pendingEarnings`, `recentProposals[]`
- Expand stat grid to 3x2 (6 cards): Active Proposals, Accepted, Total Sent, Response Rate, Total Earnings, Pending Earnings
- Replace "Recent Stories" section with "Recent Proposals" showing proposal headline, trip destination, status badge, and created date
- Each proposal links to `/proposals/{id}` or `/marketplace/request/{trip_request_id}`
- Update empty state to link to `/marketplace` instead of `/storyboards`

**3. Update header quick actions**
- Keep "View Marketplace" link
- Replace "Open Creator Lab" with "Browse Trip Requests" linking to collab opportunities
- Keep "Create Trip Package"

### Files to Change
1. `supabase/functions/creator-dashboard-stats/index.ts` — rewrite queries
2. `src/pages/CreatorDashboard.tsx` — new stat cards, proposal list, updated actions

