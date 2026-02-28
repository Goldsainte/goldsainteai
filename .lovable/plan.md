

## Fix: Earnings Tab Querying Non-Existent Columns

The `CreatorEarningsTab` shows `$0` for all values because `getPartnerBookingEarnings()` in `earningsService.ts` queries columns that don't exist on the `bookings` table. The query silently fails or returns nulls.

### Column Mapping (wrong → correct)

| Service queries | Actual column on `bookings` |
|---|---|
| `creator_commission_amount_cents` | `creator_payout_cents` |
| `agent_commission_amount_cents` | `agent_payout_cents` |
| `escrow_status` | Does not exist — use `payout_status` instead |
| `commission_mode` | Does not exist — remove |

### Escrow Logic Fix

The current code checks `escrow_status === "RELEASED"` to split pending vs released. The actual table uses `payout_status` (enum: `pending`, `processing`, `completed`, `failed`). The correct logic:
- **Released**: `payout_status = 'completed'` or `payout_paid_at IS NOT NULL`
- **Pending/Held**: everything else

### Changes

**`src/services/earningsService.ts` — `getPartnerBookingEarnings` function:**
1. Change `amountColumn` from `creator_commission_amount_cents` → `creator_payout_cents` (and agent equivalent)
2. Replace `escrow_status` and `commission_mode` in the select with `payout_status` and `payout_paid_at`
3. Update the mapping logic: use `payout_status` to determine released vs pending
4. Update the `PartnerEarningBooking` interface to match the real columns

**`src/pages/creator/components/CreatorEarningsTab.tsx`:**
- Update references from `escrow_status` → `payout_status` in the booking card display
- Remove `commission_mode` display (column doesn't exist)

