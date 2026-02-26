

# Proposal Workspace Redesign — Fiverr/Upwork-Style Bid Experience

## Overview

Transform the proposal submission from an inline form on the trip detail page into a dedicated, distraction-free wizard workspace at `/proposals/new?tripId=...`. This route already exists as a navigation target (line 381 of `TripRequestDetailPage`) but has no page behind it.

## What Changes

### 1. New Page: `src/pages/proposals/NewProposalPage.tsx`

A full-screen, focused proposal workspace with:

- **No main site footer or extra nav** — clean workspace chrome only
- **Compact top bar** showing trip title, budget range, dates, and destination as pills
- **4-step wizard** (one step visible at a time, not a long scroll):

```text
Step 1: Your Pitch
├── Large textarea: "Describe your proposed itinerary and why you're the best fit"
├── Role selector (Creator / Agent)
├── Headline input
├── Optional: attach PDF, link to sample trip
│
Step 2: Pricing
├── Total trip price (per person)
├── Deposit percentage slider/input
├── Timeline to deliver full itinerary (days)
├── Timeline to confirm bookings (days)
├── Collaboration toggle + commission split (existing logic preserved)
├── Estimated earnings after platform fee (calculated live)
│
Step 3: Deliverables
├── Checkboxes:
│   ├── Full itinerary PDF
│   ├── Booking management included
│   ├── On-trip support
│   ├── Revisions included
│   ├── Concierge services
├── Optional short notes per deliverable
│
Step 4: Review & Submit
├── Summary card with all entered data
│   ├── Price + deposit + timeline
│   ├── Pitch preview
│   ├── Deliverables list
├── Competitive context sidebar:
│   ├── "X proposals submitted so far"
│   ├── "Traveler budget: $X – $Y"
│   ├── "Proposal expires in X days"
│   ├── "Estimated earnings: $X after platform fee"
├── Primary CTA: "Submit Proposal" (bold, anchored at bottom)
```

- **Visual design**: White background for the workspace area, subtle shadow cards for each section, stronger spacing, no heavy beige. Goldsainte green (`#0c4d47`) for primary actions.

### 2. Route Registration: `src/routes/AppRoutes.tsx`

Add a new route:
```
/proposals/new → NewProposalPage (wrapped in RequireAuth)
```

### 3. Competitive Energy Elements

- Query `trip_proposals` count for the trip to show "X proposals submitted so far"
- Show traveler budget range from trip request data
- Display "You are bidding on this trip" header
- Show calculated "Estimated earnings after platform fee" (85% or 80% of quoted price)
- Auto-set proposal expiry (e.g., 14 days) and display countdown

### 4. Data Flow

- On submit, inserts into `trip_proposals` table using the same fields as the current `TripRequestDetailPage` form (proposer_id, proposer_role, headline, message, price_from, etc.)
- New optional fields for deliverables stored in `message` or a new JSON column — will use the existing `inclusions` array column on `trip_proposals` for deliverable items
- Deposit percentage → `deposit_percentage` column (already exists)
- Collaboration/commission split → same logic as current form

### 5. Files Created/Modified

| File | Action |
|------|--------|
| `src/pages/proposals/NewProposalPage.tsx` | **Create** — the main 4-step wizard workspace |
| `src/routes/AppRoutes.tsx` | **Edit** — add `/proposals/new` route |

No database migrations needed — all columns used (`headline`, `message`, `price_from`, `inclusions`, `deposit_percentage`, `nights`, `valid_until`, `proposer_id`, `proposer_role`, `agent_id`, `creator_id`, `creator_commission_pct`, `agent_commission_pct`) already exist on `trip_proposals`.

