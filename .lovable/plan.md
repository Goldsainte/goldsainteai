

# Change Platform Fee to 7% Total (3.5% Host + 3.5% Guest)

## Overview

Update the platform fee from 15% to **7% total**, split evenly: **3.5% from the agent/creator** (deducted from payout) and **3.5% from the traveler** (added to their total).

```text
Example: Agent quotes $10,000 trip

Agent sees:
  Trip price:              $10,000
  Platform fee (3.5%):       -$350
  Your payout:              $9,650

Traveler sees:
  Trip cost:              $10,000
  Service fee (3.5%):        +$350
  Total due:             $10,350

Goldsainte collects:    $350 + $350 = $700 (7%)
```

## All Files Requiring Changes

Every hardcoded 15% / 0.15 / 0.85 platform fee reference must be updated. Here is the full list:

### Frontend

| File | Current | Change |
|------|---------|--------|
| `src/lib/booking/commission.ts` (line 26) | `platformPct = 0.15` (collab) / `0.2` (solo) | Change both to `0.035` (host-side 3.5%). Add `guestFeePct = 0.035` |
| `src/pages/proposals/NewProposalPage.tsx` (line 133) | `priceFrom * 0.85` | `priceFrom * 0.965` (after 3.5% host fee) |
| `src/pages/proposals/NewProposalPage.tsx` (line 728) | "After 15% platform fee" | "After 3.5% platform fee" |
| `src/components/trips/ProposalCard.tsx` (line 95) | `totalPriceCents * 0.15` | `totalPriceCents * 0.035` |
| `src/components/trips/TripBookingPanel.tsx` (lines 91, 182) | `amountTotalCents * 0.15` / "Platform fee (15%)" | `* 0.035` / "Platform fee (3.5%)" |
| `src/pages/TripRequestDetailPage.tsx` (line 400) | `totalPriceCents * 0.15` | `totalPriceCents * 0.035` |
| `src/components/AgentBidForm.tsx` (lines 43-46, 100-103) | `0.03` service fee + `0.15` success fee | `0.035` guest service fee + `0.035` host fee |
| `src/components/CreatorEscrowDashboard.tsx` (lines 63, 66, 112) | "15%" labels, "$750" example, "$4,250" earnings | "7% total (3.5% + 3.5%)" labels, update example to $5,000 → $175 host fee → $4,825 earnings |
| `src/components/partners/PartnersFAQ.tsx` (line 31) | "15% of each booking" | "7% of each booking (3.5% from partner, 3.5% from traveler)" |
| `src/pages/onboarding/CreatorOnboardingPage.tsx` (line 737) | "Platform Fee (15%)" / "-$450" | "Platform Fee (3.5%)" / "-$105" |

### Backend (Edge Functions)

| File | Current | Change |
|------|---------|--------|
| `supabase/functions/_shared/commissionCalculator.ts` (line 34) | `PLATFORM_FEE_RATE = 0.1` | `HOST_FEE_RATE = 0.035`, `GUEST_FEE_RATE = 0.035` |
| `supabase/functions/calculate-creator-commission/index.ts` (line ~73) | `commissionWithTier * 0.1` | `amount * 0.035` (host fee on booking subtotal) |
| `supabase/functions/create-package-payment-plan/index.ts` (lines 63-64) | `totalAmount * 0.15` / `totalAmount * 0.85` | `totalAmount * 0.035` / `totalAmount * 0.965` |
| `supabase/functions/process-installment-payment/index.ts` (line 69) | `installment.amount * 0.15` | `installment.amount * 0.035` |

### Commission utility update (`src/lib/booking/commission.ts`)

Extend `CommissionBreakdown` to include:
- `hostFee` / `hostFeePct` (3.5%, deducted from agent)
- `guestFee` / `guestFeePct` (3.5%, added to traveler)
- `travelerTotal` (trip cost + guest fee)

Remove the collab vs solo distinction for platform rate — it is now always 3.5% per side regardless of mode.

### Escrow dashboard example update

```text
Customer pays:           $5,000
+ Service fee (3.5%):     +$175
= Traveler total:        $5,175

Your earnings:           $5,000
- Platform fee (3.5%):    -$175
= Your payout:           $4,825

  Upfront (20%):          $965
  Held in escrow:        $3,860
```

## Summary

17 files touched across frontend and backend. The core change is simple — replace all `0.15` / `0.85` / `15%` platform fee references with the 3.5% host + 3.5% guest split totaling 7%.

