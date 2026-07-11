// ============================================================================
// payoutMath.ts — the ONLY place money arithmetic lives
// ============================================================================
// Pure functions, no I/O, no env — which is what makes them unit-testable.
// Imported by release-trip-deposit (milestone payouts) and
// stripe-webhook-handler (collected-amount tracking).
// Behavioral tests: tests/money-guards/payout_math_test.ts
//
// The platform promise: partners keep 96.5% of the trip price (Goldsainte's
// partner-side fee is 3.5%); the traveler-side 3.5% is charged ON TOP at
// checkout. Amounts in trip_bookings are DOLLARS; Stripe wants CENTS.
// ============================================================================

export const PARTNER_SHARE_PERCENT = 96.5;
export const TRAVELER_FEE_MULTIPLIER = 1.035;

/** Round to cents precision (2 decimals). */
export const round2 = (n: number): number => Math.round(n * 100) / 100;

/** Dollars → integer cents, for Stripe amounts. */
export const toCents = (dollars: number): number => Math.round(dollars * 100);

/** The partner's total payout across all milestones for a booking. */
export function totalPartnerPayout(totalPrice: number): number {
  return round2((totalPrice * PARTNER_SHARE_PERCENT) / 100);
}

export interface Milestone {
  base: number; // the slice of totalPrice this milestone covers (dollars)
  payout: number; // 96.5% of base, what the partner receives (dollars)
  fee: number; // base - payout, Goldsainte's partner-side fee (dollars)
}

/** The working-capital milestone: 96.5% of the deposit (clamped to total). */
export function depositMilestone(totalPrice: number, depositAmount: number): Milestone {
  const base = round2(Math.min(Math.max(depositAmount, 0), totalPrice));
  const payout = round2((base * PARTNER_SHARE_PERCENT) / 100);
  return { base, payout, fee: round2(base - payout) };
}

/**
 * The final milestone: everything not yet released. Computed as
 * (total payout − deposit payout already released) rather than 96.5% of the
 * remainder, so the two milestones ALWAYS sum to the promised total to the
 * exact cent — no penny drift from double rounding.
 */
export function finalMilestone(
  totalPrice: number,
  depositBaseReleased: number,
  depositPayoutReleased: number
): Milestone {
  const base = round2(totalPrice - (Number(depositBaseReleased) || 0));
  const payout = round2(totalPartnerPayout(totalPrice) - (Number(depositPayoutReleased) || 0));
  return { base, payout, fee: round2(base - payout) };
}

/**
 * What a Stripe charge contributed toward the trip price: charges include
 * the traveler-side 3.5% fee ON TOP, so strip it before comparing to
 * total_price. Input is Stripe's amount in CENTS.
 */
export function stripTravelerFee(chargedAmountCents: number): number {
  return round2((Number(chargedAmountCents) || 0) / 100 / TRAVELER_FEE_MULTIPLIER);
}

/** Accumulate a new charge into the booking's collected-so-far (dollars). */
export function accumulateCollected(
  collectedBefore: number,
  chargedAmountCents: number
): number {
  return round2((Number(collectedBefore) || 0) + stripTravelerFee(chargedAmountCents));
}

/** Fully paid = collected covers the trip price, with a one-penny tolerance. */
export function isFullyPaid(collected: number, totalPrice: number): boolean {
  const total = Number(totalPrice) || 0;
  return total > 0 && (Number(collected) || 0) >= total - 0.01;
}
