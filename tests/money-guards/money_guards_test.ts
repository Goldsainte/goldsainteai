// ============================================================================
// MONEY GUARDS — tests/money-guards/money_guards_test.ts
// ============================================================================
// Every test here encodes an invariant of Goldsainte's money system, most of
// them named after a real bug found on Jul 11, 2026. They read the actual
// source files and fail loudly if an invariant disappears — which is exactly
// what happens when an old version of a file gets pasted over a new one
// (this repo's #1 failure mode) or when a guard gets "simplified" away.
//
// Zero dependencies. Runs with: deno test --allow-read tests/money-guards/
// CI: .github/workflows/money-guards.yml runs this on every push.
//
// If one of these fails, DO NOT delete or weaken the test to get green.
// The test is telling you real money is about to move wrong.
// ============================================================================

const cache = new Map<string, string>();
function read(path: string): string {
  if (!cache.has(path)) cache.set(path, Deno.readTextFileSync(path));
  return cache.get(path)!;
}

const RELEASE = "supabase/functions/release-trip-deposit/index.ts";
const WEBHOOK = "supabase/functions/stripe-webhook-handler/index.ts";
const CANCEL_FN = "supabase/functions/admin-process-cancellation/index.ts";
const PAYOUTS_SQL = "supabase/manual/trip-payouts.sql";
const CANCEL_SQL = "supabase/manual/trip-cancellations.sql";
const MATH = "supabase/functions/_shared/payoutMath.ts";
const TRAVELER_PAGE = "src/pages/bookings/BookingDetailPage.tsx";
const PARTNER_LIST = "src/pages/PartnerBookingsPage.tsx";
const PARTNER_DETAIL = "src/pages/PartnerBookingDetailPage.tsx";
const ADMIN_DESK = "src/pages/admin/AdminBookingsPage.tsx";
const ADMIN_CANCEL = "src/pages/AdminCancellations.tsx";

function assertContains(path: string, needle: string, why: string) {
  if (!read(path).includes(needle)) {
    throw new Error(
      `${path} no longer contains ${JSON.stringify(needle)}.\nWHY THIS MATTERS: ${why}\n` +
        `Most likely cause: an OLD version of this file was pasted over the current one.`
    );
  }
}
function assertNotContains(path: string, needle: string, why: string) {
  if (read(path).includes(needle)) {
    throw new Error(
      `${path} CONTAINS forbidden ${JSON.stringify(needle)}.\nWHY THIS MATTERS: ${why}`
    );
  }
}
function count(path: string, needle: string): number {
  return read(path).split(needle).length - 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// release-trip-deposit — the payout engine
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("partners are paid 96.5%, never 85% (Jul 11 bug: 11.5-point silent underpayment)", () => {
  assertContains(MATH, "96.5", "The platform promise is a 96.5% partner payout.");
  assertNotContains(MATH, "0.85", "An 85/15 split shipped once and underpaid every partner.");
  assertNotContains(RELEASE, "0.85", "An 85/15 split shipped once and underpaid every partner.");
  assertContains(RELEASE, '"../_shared/payoutMath.ts"', "All money math must come from the tested module.");
});

Deno.test("Stripe transfers are sent in CENTS (Jul 11 bug: $1,000 payout arrived as $8.50)", () => {
  assertContains(
    RELEASE,
    "amount: toCents(payout)",
    "trip_bookings stores dollars; Stripe wants cents. toCents is behaviorally tested."
  );
});

Deno.test("every response path can respond (Jul 11 bug: json() used req out of scope — all responses threw)", () => {
  assertContains(RELEASE, "function json(req: Request", "json must take req explicitly.");
  assertNotContains(
    RELEASE,
    "return json({",
    "A json( call without req as first arg throws at runtime AFTER money has already moved."
  );
});

Deno.test("booking metadata is MERGED, never clobbered (Jul 11 bug: releases wiped trip_id/trip_title)", () => {
  if (count(RELEASE, "...meta,") < 3) {
    throw new Error(
      `${RELEASE}: expected metadata spreads in all update paths. ` +
        `Replacing metadata wholesale deletes trip_id/trip_title/amount_collected that other pages display.`
    );
  }
});

Deno.test("milestone escrow engine is present (supersession guard — catches pasting a pre-milestone version)", () => {
  assertContains(RELEASE, "MILESTONE ESCROW", "Version marker of the Jul 11 model.");
  for (const action of ['"release_deposit"', '"release_final"', '"request_release"']) {
    assertContains(RELEASE, action, "All three actions must exist.");
  }
  assertContains(RELEASE, 'from("trip_payouts")', "Releases must be ledger-backed.");
});

Deno.test("partners can never release their own money — requests only", () => {
  assertContains(
    RELEASE,
    'isPartner ? "request_release"',
    "A stale partner page sending no action must degrade to a REQUEST, never a release."
  );
  assertContains(
    RELEASE,
    'action === "release_deposit" && !isAdmin && !isTraveler',
    "Deposit release is traveler-or-admin. The vendor must not hold the vault key."
  );
  assertContains(
    RELEASE,
    'action === "release_final" && !isAdmin && !isTraveler',
    "Final release is traveler-or-admin."
  );
});

Deno.test("final release requires the balance to actually be collected", () => {
  assertContains(
    RELEASE,
    "balance hasn't been paid yet",
    "Releasing 96.5% of money never collected drains the platform balance."
  );
});

Deno.test("double release is impossible at the function level", () => {
  assertContains(RELEASE, "already fully released", "A completed booking must refuse further releases.");
  assertContains(RELEASE, "deposit milestone was already released", "The deposit can only release once.");
});

Deno.test("releases fail honestly when the partner has no Stripe account (no phantom 'released' stamps)", () => {
  assertContains(
    RELEASE,
    "no connected Stripe account",
    "v2/v3 stamped bookings released while transferring nothing. Never again."
  );
});

Deno.test("a failed transfer never stamps a release", () => {
  assertContains(RELEASE, "nothing was released", "Transfer failure must abort with an honest message.");
});

Deno.test("completed + payout_paid_at stamp only on the FINAL milestone", () => {
  if (count(RELEASE, "payout_paid_at:") !== 1) {
    throw new Error(
      `${RELEASE}: payout_paid_at must be written in exactly one place (the final-milestone branch). ` +
        `The admin escrow pill and revenue reporting treat it as 'fully paid'.`
    );
  }
  if (count(RELEASE, 'status: "completed"') !== 1) {
    throw new Error(`${RELEASE}: only the final milestone may complete a booking.`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// stripe-webhook-handler — the payment truth
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("the webhook can tell deposit-paid from paid-in-full (Jul 11 gap: paid_in_full was never set by anything)", () => {
  assertContains(WEBHOOK, "amount_collected", "Collected money must be tracked per booking.");
  assertContains(WEBHOOK, "'paid_in_full'", "The status the release guards and review flow depend on.");
});

Deno.test("collected amounts strip the traveler-side 3.5% fee", () => {
  assertContains(MATH, "1.035", "The fee multiplier lives in the tested module.");
  assertContains(
    WEBHOOK,
    "accumulateCollected(",
    "Charges include the traveler fee ON TOP; the webhook must use the tested accumulator."
  );
});

Deno.test("full payment is detected with penny tolerance", () => {
  assertContains(MATH, "total - 0.01", "Rounding must not strand a fully-paid booking at 'confirmed'.");
  assertContains(WEBHOOK, "isFullyPaid(collected, total)", "The webhook must use the tested predicate.");
});

Deno.test("a payment is never lost to bookkeeping failure", () => {
  assertContains(WEBHOOK, "let newStatus = 'confirmed'", "Default must be plain confirmation.");
  assertContains(WEBHOOK, "fall back to plain confirm", "If tracking fails, the payment still confirms.");
});

Deno.test("the webhook merges booking metadata", () => {
  assertContains(WEBHOOK, "...prevMeta, amount_collected", "Clobbering metadata deletes trip_title and release stamps.");
});

// ─────────────────────────────────────────────────────────────────────────────
// admin-process-cancellation — the refund decision desk
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("cancellations run on the live river only (Jul 11: entire old subsystem was wired to the dead 'bookings' table)", () => {
  assertContains(CANCEL_FN, 'from("trip_cancellations")', "Live table.");
  assertContains(CANCEL_FN, 'from("trip_bookings")', "Canonical money table.");
  assertNotContains(CANCEL_FN, 'from("booking_cancellations")', "Dead legacy table.");
  assertNotContains(CANCEL_FN, 'from("bookings")', "Dead legacy table (0 rows ever).");
});

Deno.test("rejections must carry a reason — the traveler is told why", () => {
  assertContains(CANCEL_FN, "adminNotes is required when rejecting", "Honest-errors doctrine, traveler-facing.");
});

Deno.test("refunds can only be recorded from the approved state", () => {
  assertContains(CANCEL_FN, 'cancellation.status !== "approved"', "mark_refunded must gate on approval.");
});

Deno.test("the cancellation desk verifies admins and never touches Stripe (refunds are manual by design)", () => {
  assertContains(CANCEL_FN, 'from("user_roles")', "Admin verification is authoritative.");
  assertNotContains(
    CANCEL_FN,
    "esm.sh/stripe",
    "Approving a cancellation records a DECISION. Money moves only by human hands in the Stripe dashboard."
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// SQL — the ledger's teeth
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("the payout ledger blocks double release at the database itself", () => {
  assertContains(
    PAYOUTS_SQL,
    "unique index if not exists trip_payouts_booking_milestone_key",
    "Even a buggy function cannot pay the same milestone twice past this index."
  );
});

Deno.test("clients cannot write the money tables", () => {
  assertNotContains(PAYOUTS_SQL, "for insert", "trip_payouts is written ONLY by the service-role function.");
  assertNotContains(PAYOUTS_SQL, "for update", "trip_payouts rows are immutable from clients.");
  assertNotContains(CANCEL_SQL, "for update", "Cancellation decisions flow only through the edge function.");
});

// ─────────────────────────────────────────────────────────────────────────────
// Pages — the keys stay where they belong
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("traveler page is direct-charge: specialist is seller of record, no escrow UI (model change Jul 20 2026)", () => {
  // The booking pages moved off platform-held escrow to Stripe direct charges:
  // the specialist is merchant/seller of record, paid at checkout, and there is
  // no traveler-operated deposit/final "release" any more. These assertions
  // guard that the escrow UI never creeps back into the traveler page. (The
  // release-trip-deposit EDGE FUNCTION still exists for any legacy platform-held
  // bookings and is guarded by its own tests above — this is about the PAGE.)
  assertContains(TRAVELER_PAGE, "seller of record", "The direct-charge trust story: the specialist is the seller of record.");
  assertContains(TRAVELER_PAGE, "trip-checkout-create", "Payments go through the direct-charge checkout function.");
  assertNotContains(TRAVELER_PAGE, "Your escrow", "The escrow consent card is retired under direct charges.");
  assertNotContains(TRAVELER_PAGE, '"release_deposit"', "No traveler-operated deposit release under direct charges.");
  assertNotContains(TRAVELER_PAGE, '"release_final"', "No traveler-operated final release under direct charges.");
  assertNotContains(TRAVELER_PAGE, "release-trip-deposit", "The page must not invoke the legacy release engine.");
});

Deno.test("partner pages are direct-charge: partner is seller of record, no release UI (model change Jul 20 2026)", () => {
  // Under direct charges the partner IS their own Stripe merchant — traveler
  // payments land on their account at checkout, so there is no "request release"
  // flow on the partner surfaces any more. Guard that neither the list nor the
  // detail page reintroduces a release button or invokes the legacy engine.
  for (const p of [PARTNER_LIST, PARTNER_DETAIL]) {
    assertNotContains(p, '"request_release"', "No release-request flow under direct charges — the partner is paid at checkout.");
    assertNotContains(p, "release-trip-deposit", "Partner pages must not invoke the legacy release engine.");
    assertNotContains(p, "Release deposit", "No self-release button may return.");
  }
  // The detail page carries the direct-charge economics explicitly.
  assertContains(PARTNER_DETAIL, "seller of record", "The partner is the seller of record and keeps 96.5%.");
});

Deno.test("the admin desk exists as fallback with both milestone actions", () => {
  assertContains(ADMIN_DESK, '"release_deposit"', "Fallback for stuck deposit releases.");
  assertContains(ADMIN_DESK, '"release_final"', "Fallback for unresponsive travelers.");
  assertContains(ADMIN_DESK, 'from("trip_payouts")', "Escrow pills read the ledger.");
});

Deno.test("no money page reads the dead 'bookings' table", () => {
  for (const p of [TRAVELER_PAGE, PARTNER_LIST, PARTNER_DETAIL, ADMIN_DESK, ADMIN_CANCEL]) {
    assertNotContains(
      p,
      'from("bookings")',
      "The legacy table has 0 rows ever; reading it makes a page blind."
    );
  }
});


// ---------------------------------------------------------------------------
// FLAT 7% ON EVERY CREATOR RAIL — founder decision, Jul 23 2026.
// Before tonight: tips charged 3.5%, product sales a hardcoded 30% that
// contradicted every fee promise on the site, and guide sales collected into
// the PLATFORM account with no fee and no creator payout mechanism at all.
// One number now, one mechanic: 7%, taken as a Stripe application_fee on a
// direct charge to the creator's connected account.
// ---------------------------------------------------------------------------
const TIP_CHECKOUT = "supabase/functions/create-tip-checkout/index.ts";
const PRODUCT_CHECKOUT = "supabase/functions/purchase-product/index.ts";
const GUIDE_CHECKOUT = "supabase/functions/itinerary-checkout/index.ts";

Deno.test("tips take the flat 7% platform fee", () => {
  assertContains(TIP_CHECKOUT, "TIP_FEE_RATE = 0.07", "Tips must charge the flat 7% of Jul 23 2026 — if this is gone, an old file was pasted over the new one.");
  assertNotContains(TIP_CHECKOUT, "TIP_FEE_RATE = 0.035", "The 3.5% tip fee is retired; 7% flat on every creator rail.");
});

Deno.test("product sales take 7%, never the legacy 30%", () => {
  assertContains(PRODUCT_CHECKOUT, "totalAmount * 0.07", "Product sales must charge the flat 7%.");
  assertNotContains(PRODUCT_CHECKOUT, "totalAmount * 0.30", "The hardcoded 30% product fee silently contradicted the site's fee promises. It must never return.");
});

Deno.test("guide sales are direct charges with the 7% fee and refuse without a seller account", () => {
  assertContains(GUIDE_CHECKOUT, "application_fee_amount", "Guide sales must take the 7% as an application fee on a direct charge.");
  assertContains(GUIDE_CHECKOUT, "stripeAccount: creatorAccountId", "Guide sales must charge on the creator's connected account — never collect into the platform account.");
  assertContains(GUIDE_CHECKOUT, "NO_SELLER_ACCOUNT", "A guide sale without a ready creator payout account must refuse, not silently collect platform-side.");
});
