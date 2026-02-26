

# Fix: "Something went wrong" error after proposal submission

## Root Cause Analysis

The `handleSubmit` function in `NewProposalPage.tsx` (lines 236-349) has **no try/catch wrapper**. If any of the async operations throw an uncaught exception (supabase insert, attachment save, or navigation), the unhandled promise rejection crashes the app. The MemberLayout error boundary catches it and shows "Something went wrong while loading the member experience."

Additionally, there's a **data shape mismatch** in `cancellation_windows`:
- **Stored** (NewProposalPage): `{ band: string; refund_pct: number }`
- **Read** (ProposalDetailPage): expects `{ label: string; refund_percent: number }`

And `external_links`:
- **Stored**: `string[]` (plain strings)
- **Read**: expects `{ label: string; url: string }[]`

These mismatches could cause rendering crashes on the detail page when accessing properties on the wrong type.

## Changes

### File 1: `src/pages/proposals/NewProposalPage.tsx`

1. **Wrap `handleSubmit` in try/catch** — catch any thrown errors and show a toast instead of crashing.

2. **Fix `cancellation_windows` shape** in the `priceBreakdown` object (line 261) — map `{ band, refund_pct }` to `{ label, refund_percent }` so the detail page can read it correctly.

3. **Fix `external_links` shape** (line 265) — store as `{ label: string; url: string }[]` instead of `string[]`.

### File 2: `src/pages/proposals/ProposalDetailPage.tsx`

1. **Add defensive guards** on `cancellation_windows` and `external_links` rendering to handle both old and new data shapes without crashing.

2. **Add defensive guard** on `payment_schedule` rendering to handle `{ name, percentage }` shape (from form) in addition to `{ label, due_on, amount }` shape.

These are small, focused fixes — wrap the submit in try/catch and add null-safe property access on the detail page to prevent render crashes from data shape mismatches.

