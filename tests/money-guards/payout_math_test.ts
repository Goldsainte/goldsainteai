// ============================================================================
// PAYOUT MATH — BEHAVIORAL TESTS
// ============================================================================
// Unlike money_guards_test.ts (which checks the SOURCE for invariants),
// these tests EXECUTE the actual money arithmetic with fake bookings and
// assert exact dollar-and-cent outcomes. This is the layer that would have
// caught the Jul 11 bugs (85% split, dollars-as-cents) before any human
// read the file. Runs in the same CI job.
// ============================================================================

import {
  round2,
  toCents,
  totalPartnerPayout,
  depositMilestone,
  finalMilestone,
  stripTravelerFee,
  accumulateCollected,
  isFullyPaid,
  PARTNER_SHARE_PERCENT,
} from "../../supabase/functions/_shared/payoutMath.ts";

function assertEquals(actual: unknown, expected: unknown, msg: string) {
  if (actual !== expected) {
    throw new Error(`${msg}\n  expected: ${expected}\n  actual:   ${actual}`);
  }
}

Deno.test("the canonical example: $10,000 trip, $3,000 deposit", () => {
  const dep = depositMilestone(10000, 3000);
  assertEquals(dep.payout, 2895, "deposit payout must be 96.5% of $3,000");
  assertEquals(toCents(dep.payout), 289500, "Stripe transfer must be exactly 289,500 cents");
  assertEquals(dep.fee, 105, "partner-side fee on the deposit slice");

  const fin = finalMilestone(10000, dep.base, dep.payout);
  assertEquals(fin.base, 7000, "final slice is the remainder");
  assertEquals(fin.payout, 6755, "final payout = total payout − deposit payout");
  assertEquals(toCents(fin.payout), 675500, "final transfer in cents");

  assertEquals(
    round2(dep.payout + fin.payout),
    totalPartnerPayout(10000),
    "the two milestones must sum EXACTLY to the promised 96.5%"
  );
  assertEquals(round2(dep.fee + fin.fee), 350, "total partner-side fee = 3.5% of $10,000");
});

Deno.test("Jul 11 regression: the split is 96.5, and a $1,000 payout is 100,000 cents — never $8.50", () => {
  assertEquals(PARTNER_SHARE_PERCENT, 96.5, "the platform promise");
  assertEquals(totalPartnerPayout(1000), 965, "96.5% of $1,000");
  assertEquals(toCents(965), 96500, "dollars→cents conversion (the bug sent 965 'cents' = $9.65)");
  // The 85% world must be dead:
  if (totalPartnerPayout(1000) === 850) throw new Error("85/15 split has returned");
});

Deno.test("penny drift is impossible: milestones always sum exactly, across awkward amounts", () => {
  const cases: Array<[number, number]> = [
    [999.99, 333.33],
    [1234.56, 617.28],
    [10000, 3333.33],
    [777.77, 77.77],
    [1, 0.5],
    [15000.01, 4999.99],
  ];
  for (const [total, deposit] of cases) {
    const dep = depositMilestone(total, deposit);
    const fin = finalMilestone(total, dep.base, dep.payout);
    assertEquals(
      round2(dep.payout + fin.payout),
      totalPartnerPayout(total),
      `sum drift on total=${total} deposit=${deposit}`
    );
    assertEquals(
      round2(dep.base + fin.base),
      round2(total),
      `base slices must cover the whole price (total=${total})`
    );
    assertEquals(toCents(dep.payout) % 1, 0, "transfers are integer cents");
    assertEquals(toCents(fin.payout) % 1, 0, "transfers are integer cents");
  }
});

Deno.test("property sweep: 500 random bookings, invariants hold on every one", () => {
  let seed = 424242;
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  for (let i = 0; i < 500; i++) {
    const total = round2(50 + rand() * 49950); // $50 – $50,000
    const deposit = round2(rand() * total);
    const dep = depositMilestone(total, deposit);
    const fin = finalMilestone(total, dep.base, dep.payout);
    const sum = round2(dep.payout + fin.payout);
    assertEquals(sum, totalPartnerPayout(total), `sum invariant broke at total=${total} deposit=${deposit}`);
    if (dep.payout < 0 || fin.payout < 0) throw new Error(`negative payout at total=${total} deposit=${deposit}`);
    if (dep.payout > totalPartnerPayout(total)) throw new Error("deposit payout exceeded the total payout");
  }
});

Deno.test("edge cases: zero deposit, deposit equals total, deposit exceeds total, negative deposit", () => {
  assertEquals(depositMilestone(1000, 0).payout, 0, "no deposit → no working capital");
  assertEquals(depositMilestone(1000, 1000).payout, 965, "deposit == total pays the full 96.5% up front");
  assertEquals(finalMilestone(1000, 1000, 965).payout, 0, "nothing left after a full deposit release");
  assertEquals(depositMilestone(1000, 5000).base, 1000, "deposit clamps to the trip price");
  assertEquals(depositMilestone(1000, -50).payout, 0, "negative deposit clamps to zero");
});

Deno.test("collected-amount tracking: deposit then balance reaches paid-in-full, fees stripped", () => {
  // Traveler pays $3,000 deposit → charged $3,105 (310,500 cents with 3.5% fee on top)
  const afterDeposit = accumulateCollected(0, 310500);
  assertEquals(afterDeposit, 3000, "fee-stripped deposit contribution");
  assertEquals(isFullyPaid(afterDeposit, 10000), false, "deposit alone is not paid in full");

  // Then the $7,000 balance → charged $7,245 (724,500 cents)
  const afterBalance = accumulateCollected(afterDeposit, 724500);
  assertEquals(afterBalance, 10000, "collected covers the trip price exactly");
  assertEquals(isFullyPaid(afterBalance, 10000), true, "now paid in full");
});

Deno.test("paid-in-full tolerance: one penny of rounding never strands a booking", () => {
  assertEquals(isFullyPaid(9999.99, 10000), true, "within the one-penny tolerance");
  assertEquals(isFullyPaid(9999.98, 10000), false, "two pennies short is short");
  assertEquals(isFullyPaid(0, 0), false, "a zero-price booking is never 'paid'");
  assertEquals(isFullyPaid(100, 0), false, "guard against missing total_price");
});

Deno.test("single full payment (typical creator booking) goes straight to paid-in-full", () => {
  // $500 trip paid at once → charged $517.50 (51,750 cents)
  const collected = accumulateCollected(0, 51750);
  assertEquals(collected, 500, "fee stripped");
  assertEquals(isFullyPaid(collected, 500), true, "one payment, fully paid — the creator flow");
});

Deno.test("fee stripping round-trips cleanly for whole-dollar prices", () => {
  for (const price of [1, 50, 100, 999, 2500, 10000]) {
    const chargedCents = Math.round(price * 1.035 * 100);
    assertEquals(
      stripTravelerFee(chargedCents),
      price,
      `stripping the fee from a charge for $${price} must return $${price}`
    );
  }
});
