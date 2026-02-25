

# Redesign Proposal Form as Multi-Step Wizard

## Overview

Extract the proposal form (currently lines 664-801) from `TripRequestDetail.tsx` into a dedicated multi-step wizard component. The wizard will use the existing luxury design language (cream backgrounds, gold accents, rounded cards) and mirror the `LuxuryStepIndicator` pattern already used in onboarding.

## Step Breakdown

The current form fields naturally group into 4 steps:

| Step | Title | Fields |
|---|---|---|
| 1 — Pricing | Pricing & Timeline | Price (USD), Timeline (days), Deposit %, Deposit due days |
| 2 — Itinerary | What's Included | Included (textarea), Not included (textarea), Itinerary overview (textarea) |
| 3 — Fit | Why You | "Why you're a great fit" (textarea) |
| 4 — Policies | Confirm & Submit | Cancellation policy selector, custom cancellation terms, both policy acknowledgement checkboxes, MarketplaceDisclaimer, Submit button |

## New Component

**File: `src/components/marketplace/ProposalWizard.tsx`**

- Receives `newProposal` state, `setNewProposal`, `onSubmit`, `submittingProposal`, `proposalsCount`, `userProfile` as props
- Internal `wizardStep` state (0-3)
- Renders `LuxuryStepIndicator` at the top with 4 steps (icons: DollarSign, FileText, User, Shield)
- Each step is a card with the same `luxuryInputClass` styling
- "Next" button validates required fields per step before advancing; "Back" button goes to previous step
- Step 4 shows summary of previous steps in a compact review block, plus the policy checkboxes and Submit button
- Profile card (lines 674-716) stays above the wizard as context
- Smooth crossfade transition between steps using CSS opacity/translate

## Changes to `TripRequestDetail.tsx`

- Import `ProposalWizard`
- Replace the inline form block (lines 664-801) with `<ProposalWizard ... />`
- Keep the `id="proposal-form"` on the wrapper div so scroll-to-form CTAs still work
- All state (`newProposal`, `setNewProposal`, `handleSubmitProposal`, `submittingProposal`) stays in the parent — the wizard is purely presentational

## Per-Step Validation

| Step | Required to advance |
|---|---|
| 1 | Price > 0 |
| 2 | Itinerary overview non-empty |
| 3 | Fit reason non-empty |
| 4 | Both checkboxes checked (enforced by submit button disabled state, already exists) |

"Back" is always enabled. Users can click completed steps in the indicator to jump back.

## Visual Design

- Step indicator: reuses `LuxuryStepIndicator` with gold completed states and check marks
- Card container: `rounded-2xl border border-[#E5DFC6] bg-white p-5 md:p-6 shadow-sm` (matches current)
- Step transition: `transition-opacity duration-200` for a lightweight fade
- Progress text below indicator: "Step 1 of 4 — Pricing & Timeline"

## Files

| File | Action |
|---|---|
| `src/components/marketplace/ProposalWizard.tsx` | Create — multi-step wizard component |
| `src/pages/marketplace/TripRequestDetail.tsx` | Edit — replace inline form with `<ProposalWizard />` |

