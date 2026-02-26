

# Test Results: 7% Fee Split (3.5% Host + 3.5% Guest)

## Verification Summary

I reviewed all files that were updated in the previous implementation. Here is what I found:

### PASS — Frontend Commission Utility
`src/lib/booking/commission.ts` correctly defines:
- `HOST_FEE_PCT = 0.035` (3.5%)
- `GUEST_FEE_PCT = 0.035` (3.5%)
- `PLATFORM_TOTAL_PCT = 0.07` (7%)
- `hostFee`, `guestFee`, `travelerTotal` all computed correctly

### PASS — Proposal Form (NewProposalPage)
- Commission model selector (percentage / flat_fee / hybrid) is in place
- `commissionCalc` useMemo correctly uses `HOST_FEE_PCT` and `GUEST_FEE_PCT` from the shared constants
- Fee Breakdown card shows: Your Commission, Platform fee (3.5%), Your Payout, Traveler Total

### PASS — Proposal Detail Page
- Commission Structure section renders per model (percentage, flat_fee, hybrid, tiered)
- Traveler-facing rows: "Service Fee (3.5%)" + "Traveler Total"
- Agent-facing rows: "Your Commission" + "Platform Fee (3.5%)" + "Your Payout"

### PASS — TripBookingPanel
- Line 91: `amountTotalCents * 0.035` — correct
- Line 182: Label reads "Platform fee (3.5%)" — correct

### PASS — CreatorEscrowDashboard
- Shows "7% total (3.5% + 3.5%)" label
- Example: $5,000 customer payment → $175 platform fee → $4,825 earnings

### PASS — AgentBidForm
- Service fee: `price * 0.035` (guest side)
- Success fee: `price * 0.035` (host side)

### PASS — PartnersFAQ
- Reads: "7% of each booking — split evenly as 3.5% from partners and 3.5% from travelers"

---

### ISSUE FOUND — Database Function `calculate_bid_pricing`

The Postgres function `calculate_bid_pricing` still has **default parameters** of `service_fee_pct = 3.0` and `success_fee_pct = 15.0` (the old rates). While the frontend code no longer uses these defaults (it always passes `0.035` directly), the database function should be updated for consistency.

**Fix**: Run a migration to update the function defaults:
- `service_fee_pct DEFAULT 3.5` (was 3.0)
- `success_fee_pct DEFAULT 3.5` (was 15.0)
- Update the internal calculation to match the new split model

### Implementation

One database migration to update `calculate_bid_pricing`:

```sql
CREATE OR REPLACE FUNCTION public.calculate_bid_pricing(
  agent_price numeric,
  service_fee_pct numeric DEFAULT 3.5,
  success_fee_pct numeric DEFAULT 3.5
) RETURNS jsonb ...
```

This is a minor consistency fix — the frontend already works correctly with the 3.5%/3.5% split. No other issues found across all 14 files.

