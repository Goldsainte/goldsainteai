

# Fix Post-Submission Flow + Redesign Proposal Pages

## Problems Identified

1. **Broken post-submission redirect**: `NewProposalPage` navigates to `/trip-requests/${tripId}` after submit — a route that just shows the trip detail again, not the proposal. Should redirect to the proposal detail page with the actual proposal ID.

2. **ProposalDetailPage is visually broken**: Uses 9-11px text throughout, beige-on-beige (`bg-[#f7f3ea]`), thin borders, no serif headers. Completely mismatches the Farfetch x Mr & Mrs Smith luxury aesthetic used everywhere else. This is the page the traveler lands on to review a proposal.

3. **ProposalsForTripPage is similarly broken**: Same tiny text, no luxury tokens. This is where a traveler compares proposals for their trip.

4. **No traveler notification**: The `notify-trip-proposal` edge function doesn't exist. When an agent submits a proposal, the traveler gets no notification and has no idea where to find it.

5. **Dead-end navigation**: "Back to trips" links point to `/my-trips` or `/tiktok-lab/trips` — generic routes that may not help the traveler find their proposals.

## What Changes

### 1. Fix Post-Submission Redirect (`NewProposalPage.tsx`)

Change `handleSubmit` to:
- Capture the inserted proposal's ID from the Supabase response
- Navigate to `/proposals/${newProposalId}` instead of `/trip-requests/${tripId}`
- Show a proper success state

### 2. Redesign `ProposalDetailPage.tsx` — Full Luxury Overhaul

- **Background**: `bg-white` main, cream `#FDF9F0` accent cards
- **Typography**: Serif headers (`font-secondary`) at 24-28px for title, body text at 14-15px (not 9-11px), labels at 12-13px
- **Layout**: Two-column with main content (pitch, inclusions, payment plan) and sticky sidebar (proposer info, actions, trust)
- **Cards**: White with subtle shadows (`shadow-[0_1px_12px_rgba(0,0,0,0.06)]`), rounded-2xl, no thin beige borders
- **Status badges**: Larger, properly styled with Goldsainte green
- **Action buttons**: Full-width, bold CTAs (Accept / Decline) with proper sizing
- **Price display**: Large, prominent, styled as a hero element

### 3. Redesign `ProposalsForTripPage.tsx` — Luxury Comparison View

- Same luxury tokens as above
- Proposal cards as proper comparison cards with larger text, clear pricing, proposer name
- Proper serif header "Proposals for [Trip Title]"
- Body text at readable sizes (14px+)

### 4. Create `notify-trip-proposal` Edge Function

- Triggered after proposal insert in `NewProposalPage`
- Inserts an in-app notification for the traveler: "You received a new proposal for [Trip Title]"
- Links to `/proposals/${proposalId}` so the traveler can find it directly
- Sends email notification via Resend if configured (same pattern as `notify-new-bid`)

### 5. Connect Traveler Discovery Path

- Ensure `/my-trips?tab=requests` shows proposal counts per trip request
- Each trip request links to `/proposals/for-trip?tripId=...` so the traveler can see all proposals

## Files Modified

| File | Action |
|------|--------|
| `src/pages/proposals/NewProposalPage.tsx` | **Edit** — fix redirect to use proposal ID, call notification function |
| `src/pages/proposals/ProposalDetailPage.tsx` | **Major rewrite** — luxury aesthetic, proper typography, better layout |
| `src/pages/proposals/ProposalsForTripPage.tsx` | **Major rewrite** — luxury aesthetic, readable text, proper cards |
| `supabase/functions/notify-trip-proposal/index.ts` | **Create** — traveler notification on new proposal |

