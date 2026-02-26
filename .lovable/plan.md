

# Proposal Detail Page: Structured Service Agreement Redesign

## Current State

The `ProposalDetailPage.tsx` displays a flat preview with:
- Hero header (destination, dates, price, status)
- "The Pitch" (raw text dump)
- "What's Included" / "What's Not Included" (raw text dumps)
- "Payment Plan" (almost always empty — only checks `payment_schedule`)
- Sidebar with proposer info + accept/decline for travelers
- No agent actions, no cancellation terms, no pricing breakdown, no scope details, no attachments

The `proposalsService.ts` `getProposalDetail` query only fetches 13 columns, missing: `itinerary_summary`, `deposit_percentage`, `deposit_due_days`, `custom_cancellation_terms`, `price_breakdown`, and `proposal_attachments`.

All these columns exist in the database and are populated by the 7-step wizard.

---

## Changes

### File 1: `src/services/proposalsService.ts`

**Expand the query and type to fetch all contract data:**

Add to the `select()` call:
- `itinerary_summary`
- `deposit_percentage`
- `deposit_due_days`
- `custom_cancellation_terms`
- `price_breakdown`

Expand `ProposalDetail` type with:
- `itinerary_summary: string | null`
- `deposit_percentage: number | null`
- `deposit_due_days: number | null`
- `custom_cancellation_terms: string | null`
- `price_breakdown: any | null` (JSON with `service_level`, `revision_count`, `support_level`, `pricing_type`, `pricing_confirmed`, `planning_fee`, `planning_fee_refundable`, `balance_due`, `deposit_refundable`, `cancellation_windows`, `change_fee`, `supplier_dependent`, `supplier_dependent_note`, `external_links`, `handles_supplier_payments`)
- `attachments: { id: string; file_name: string; file_path: string; file_type: string | null }[]`

Add a sub-query after the main fetch to get attachments from `proposal_attachments` table.

Map the new fields into the return object.

### File 2: `src/pages/proposals/ProposalDetailPage.tsx`

**Major rewrite of the page body. New section structure:**

#### Section 1: Offer Overview (replaces current hero)
Compact card-style header:
- "Trip Proposal" label + headline
- Destination + dates + nights
- **Total Price** prominently displayed
- **Deposit Due** calculated from `deposit_percentage` and `price_from` (e.g., "$2,500 (25%)")
- **Balance Due** from `price_breakdown.balance_due`
- **Valid Until** with urgency color if < 3 days remaining
- **Status** badge

#### Section 2: The Pitch
- Keep existing message display but add gold left-border accent
- If `itinerary_summary` exists, show it as a sub-section within the pitch card

#### Section 3: Scope of Services (NEW)
Structured card with two columns:

**Included** — bullet list with green checkmark icons, split from `inclusions` array by newline

**Not Included** — bullet list with red X icons, split from `exclusions` array by newline

**Service details row** (below the lists):
- Service Level badge from `price_breakdown.service_level`
- Support Level from `price_breakdown.support_level`
- Revisions from `price_breakdown.revision_count`
- Supplier payment handling from `price_breakdown.handles_supplier_payments`

#### Section 4: Payment & Cancellation Terms (NEW — the critical missing piece)
Two sub-sections in one card:

**Pricing Breakdown:**
- Pricing type label (Per Person / Total)
- Planning fee if applicable (with refundable/non-refundable tag)
- Pricing status badge: "Confirmed" or "Estimate"
- Deposit: X% due within Y days
- Balance due timing

**Cancellation Policy:**
- Deposit refundability badge (from `price_breakdown.deposit_refundable`)
- 4-tier cancellation window table from `price_breakdown.cancellation_windows`:
  - Color-coded rows: green (60+) → amber (30-59) → orange (14-29) → red (<14)
  - Each row: "60+ days before departure → 90% refund"
- Change fee if set
- Supplier-dependent clause if flagged
- Custom cancellation terms if any

**Payment Schedule:**
- Milestone table from `payment_schedule` array
- Each row: milestone name, due date, calculated amount

#### Section 5: Attachments (NEW, conditional)
If attachments exist or external links exist in `price_breakdown.external_links`:
- List uploaded files with file type icons and download links (generate signed URLs)
- List external links as clickable items

#### Section 6: What Happens Next (NEW)
Contextual card explaining the acceptance flow:
- "If the traveler accepts this proposal:"
  1. Deposit is charged
  2. Proposal becomes an active booking
  3. Itinerary confirmation begins
  4. Final documents delivered before departure

#### Sidebar Changes

**For Agents (proposal owner):**
- Add **Withdraw Proposal** button (calls `withdrawProposal()` with confirmation dialog)
- Add **Edit Proposal** button (links to `/proposals/new?tripId=X&edit=proposalId`)
- Add **Duplicate Proposal** button (links to `/proposals/new?tripId=X&duplicate=proposalId`)
- Status-contextual messaging:
  - Sent: "The traveler hasn't reviewed this yet. You can withdraw or edit."
  - Traveler review: "The traveler is reviewing your proposal."
  - Accepted/Declined/Withdrawn: appropriate read-only messages

**For Travelers:**
- Keep existing accept/decline buttons and safety review
- The new sections above provide the missing context they need before deciding

**Proposal metadata (new card below proposer):**
- Submitted: date
- Valid until: date (urgency styling)
- Proposal ID (truncated)

---

## Files Modified

| File | Action |
|------|--------|
| `src/services/proposalsService.ts` | Expand `ProposalDetail` type + `getProposalDetail` query to include all contract fields + attachments sub-query |
| `src/pages/proposals/ProposalDetailPage.tsx` | Major rewrite — add offer overview, scope of services, payment & cancellation terms, attachments, what happens next, agent action buttons |

No database changes needed.

