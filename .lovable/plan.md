

# Fix: Back Button on Proposal Pages Should Navigate to Marketplace/Trip Briefs

## Problem

All proposal pages (`NewProposalPage`, `ProposalDetailPage`, `ProposalsForTripPage`) use `navigate(-1)` for their back buttons. If the browser history stack doesn't have the expected previous page (e.g., user opened the link directly, or history was cleared), `navigate(-1)` lands on `/` which shows a 404.

## Changes

### File 1: `src/pages/proposals/NewProposalPage.tsx`

**Line 389** — Replace `navigate(-1)` with a deterministic back target. Since we know the `tripId` from the URL query param, navigate to `/marketplace/request/${tripId}` (the trip brief detail page). Fallback to `/marketplace` if no tripId.

Also update the error-state back button on **line 372** the same way.

### File 2: `src/pages/proposals/ProposalDetailPage.tsx`

**Line 216** — Replace `navigate(-1)` with navigation to the trip brief page if the trip ID is available, otherwise `/marketplace`.

### File 3: `src/pages/proposals/ProposalsForTripPage.tsx`

**Line 96** — Same fix: navigate to `/marketplace/request/${tripId}` or `/marketplace`.

These are three single-line changes — replacing `navigate(-1)` with a deterministic route derived from the trip ID already available in each component.

