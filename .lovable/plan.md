

# Add Commission Pricing Model to Proposal Form

## Current State

The proposal form (Step 2: Pricing & Payment) currently has:
- Pricing type (per person / total)
- Trip cost input (single dollar amount)
- Optional planning fee checkbox with amount
- Deposit slider, balance due, payment schedule
- Estimated earnings shown as `priceFrom * 0.965` (after 3.5% platform fee)

There is **no way for agents to define how they earn** — no commission percentage, no flat fee vs percentage selector, no tiered brackets. The traveler sees a single "Trip Cost" with no breakdown of what portion is commission vs planning fees.

The `price_breakdown` JSONB column already stores arbitrary data, so no schema changes are needed.

## Changes

### File 1: `src/pages/proposals/NewProposalPage.tsx`

**New state variables** (after line 102):
- `commissionModel`: `"percentage" | "flat_fee" | "hybrid"` — default `"percentage"`
- `commissionPct`: `number | ""` — default `15`
- `commissionTiered`: `boolean` — default `false`
- `commissionTiers`: `{ threshold: number; pct: number }[]` — default `[{ threshold: 5000, pct: 20 }, { threshold: Infinity, pct: 15 }]`
- `flatFeeAmount`: `number | ""` — for flat fee model
- `flatFeeCovers`: `string` — default `"planning"` (options: planning, execution, full_service)
- `hybridFlatFee`: `number | ""`
- `hybridCommissionPct`: `number | ""`

**New UI section** inserted into Step 2 (between the Trip Cost input at line 566 and the planning fee section at line 568):

1. **Pricing Model selector** — 3-option radio card group:
   - "Percentage Commission" — subtitle: "Earn a % of total trip value"
   - "Flat Planning Fee" — subtitle: "Charge a fixed service fee"
   - "Hybrid" — subtitle: "Fixed fee + percentage commission"

2. **Conditional inputs based on model:**

   If **percentage**:
   - Commission % input (numeric, decimals allowed, min 1, max 50)
   - Tooltip icon: "Industry standard is 10–20% commission on total trip value. Luxury and bespoke experiences may command 15–25%."
   - "Is it tiered?" checkbox
   - If tiered: editable tier rows (threshold $ + percentage %), with add/remove buttons — e.g. "First $5,000 at 20%" / "Above $5,000 at 15%"

   If **flat fee**:
   - Fee amount input ($)
   - "Fee covers" select: Planning only / Planning + Execution / Full service
   - Tooltip icon: "Typical flat fees range from $299–$1,500+ depending on trip complexity."

   If **hybrid**:
   - Flat fee input ($)
   - Commission % input
   - Tooltip icon: "Common hybrid: $500 planning fee + 10% commission on bookings."

3. **Replace the earnings summary** (lines 725-730) with a detailed breakdown card:

```text
┌─────────────────────────────────────────┐
│  Fee Breakdown                          │
│                                         │
│  Your Commission              $1,500    │
│  Platform fee (3.5%):           -$350   │
│  ─────────────────────────────────────  │
│  Your Estimated Payout        $1,150    │
│                                         │
│  What the Traveler Pays                 │
│  Trip Cost                   $10,000    │
│  Service Fee (3.5%)             +$350   │
│  ─────────────────────────────────────  │
│  Traveler Total              $10,350    │
└─────────────────────────────────────────┘
```

**Update estimated earnings calculation** (lines 131-134) — dynamic logic based on model:

```
if percentage: commission = tripCost × (commissionPct / 100)
  if tiered: sum of (min(tripCost, threshold) × tier_pct) per bracket
if flat_fee: commission = flatFeeAmount
if hybrid: commission = hybridFlatFee + (tripCost × hybridCommissionPct / 100)

hostFee = tripCost × 0.035
guestFee = tripCost × 0.035
agentPayout = commission - hostFee
travelerTotal = tripCost + guestFee
```

**Update `priceBreakdown` object** (lines 204-218) — add fields:
```
commission_model, commission_pct, commission_tiered, commission_tiers,
flat_fee_amount, flat_fee_covers, hybrid_flat_fee, hybrid_commission_pct,
host_fee_pct: 3.5, guest_fee_pct: 3.5, platform_total_pct: 7,
agent_commission_estimate, agent_payout_estimate, traveler_total_estimate, guest_service_fee_estimate
```

**Remove the existing planning fee section** (lines 568-605) since it's now subsumed by the flat fee / hybrid model options.

### File 2: `src/pages/proposals/ProposalDetailPage.tsx`

**Enhance the Pricing Breakdown section** (lines 432-484):

Add a "Commission Structure" sub-section between the pricing type and trip cost rows:
- If `commission_model === "percentage"`: "Commission: X% on total trip value"
- If `commission_model === "flat_fee"`: "Service Fee: $X (covers: planning/execution/full service)"
- If `commission_model === "hybrid"`: "Service Fee: $X + Y% commission"
- If tiered: render tier bracket rows (e.g. "First $5,000 at 20%", "Above $5,000 at 15%")

Add **transparent traveler-facing rows** after the trip cost:
- "Service Fee (3.5%)" row showing the guest fee amount
- "Traveler Total" row showing trip cost + guest fee
- Tooltip on service fee: "Covers Goldsainte traveler protection, support, and secure payment processing."

Add **agent-facing rows** (visible only when current user is the proposer):
- "Your Commission" — the agent's commission from their selected model
- "Platform Fee (3.5%)" — host fee deducted
- "Your Payout" — net earnings

## Files Modified

| File | Action |
|------|--------|
| `src/pages/proposals/NewProposalPage.tsx` | Add commission model selector (percentage/flat/hybrid), tiered support, dynamic earnings calculation with 3.5%/3.5% split breakdown, update `price_breakdown` payload |
| `src/pages/proposals/ProposalDetailPage.tsx` | Display commission structure + split fee breakdown for agent and traveler views |

No database changes needed — all new fields stored in the existing `price_breakdown` JSONB column.

