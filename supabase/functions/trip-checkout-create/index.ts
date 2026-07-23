// trip-checkout-create v2.0 - DIRECT CHARGES: agent is merchant of record on their Standard account;
//        Goldsainte commission via application_fee (7% of slice base when the traveler fee rides on
//        top, 3.5% on bare-base charges). Legacy platform-charged and partnerless bookings stay on
//        the platform path — charge models never mix within one booking. (2026-07-19)
// v1.2 - SOT residency gate: CA/FL/HI/IA/WA declined; attested state stamped on booking + PI (2026-07-19)
// v1.1 - never regress a confirmed/paid booking to payment_pending (2026-07-18)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Stripe from "https://esm.sh/stripe@15.11.0?target=deno";

function corsHeaders(_req?: Request): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "https://goldsainte.ai",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

interface RequestBody {
  tripBookingId: string;
  amountTotalCents: number;
  currency?: string;
  successUrl?: string;
  cancelUrl?: string;
  affiliateCode?: string;
  gclid?: string;
  residenceState?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }

  try {
    // Verify caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const body = (await req.json()) as RequestBody;
    const { tripBookingId, amountTotalCents, currency = "usd" } = body;
    const affiliateCode =
      typeof body.affiliateCode === "string" &&
      /^[a-zA-Z0-9_-]{3,64}$/.test(body.affiliateCode)
        ? body.affiliateCode
        : undefined;
    const gclid =
      typeof body.gclid === "string" &&
      body.gclid.length > 0 &&
      body.gclid.length <= 256
        ? body.gclid
        : undefined;
    const residenceState =
      typeof body.residenceState === "string" &&
      /^[A-Za-z]{2,4}$/.test(body.residenceState.trim())
        ? body.residenceState.trim().toUpperCase()
        : undefined;

    if (!tripBookingId || !amountTotalCents || amountTotalCents <= 0) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid payload" }),
        {
          status: 400,
          headers: { ...corsHeaders(req), "Content-Type": "application/json" }
        }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecret) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2024-06-20",
    });

    // Load the booking. trip_requests is joined as OPTIONAL (no !inner):
    // request-based bookings have one; marketplace (packaged-trip) bookings
    // do not. traveler_id lets us verify ownership in the marketplace case.
    const { data: booking, error: bookingError } = await supabase
      .from("trip_bookings")
      .select(`
        id,
        trip_request_id,
        proposal_id,
        traveler_id,
        partner_id,
        partner_role,
        currency,
        total_price,
        deposit_amount,
        status,
        metadata,
        trip_requests (
          id,
          user_id,
          destination,
          source_metadata
        )
      `)
      .eq("id", tripBookingId)
      .single();

    if (bookingError || !booking) {
      throw bookingError ?? new Error("Booking not found");
    }

    let matchedBaseCents = 0; // slice base (deposit/balance/total) for application-fee math (v2.0)
    // ------------------------------------------------------------------
    // MONEY GUARD (Jul 18): never trust a client-supplied amount. The
    // column standard is integer CENTS. The requested charge must match
    // the booking's own deposit, balance, or total — each optionally plus
    // the 3.5% traveler service fee — within $1. A client-side unit bug
    // once produced a $58,218.75 checkout for a $562.50 deposit; this
    // makes that class of error impossible regardless of caller.
    // ------------------------------------------------------------------
    {
      const totalCents = Math.max(0, Math.round(Number(booking.total_price ?? 0)));
      const depositCents = Math.max(0, Math.round(Number(booking.deposit_amount ?? 0)));
      const balanceCents = Math.max(0, totalCents - depositCents);
      const withFee = (c: number) => Math.round(c * 1.035);
      const allowedPairs = [
        { amount: depositCents, base: depositCents },
        { amount: withFee(depositCents), base: depositCents },
        { amount: balanceCents, base: balanceCents },
        { amount: withFee(balanceCents), base: balanceCents },
        { amount: totalCents, base: totalCents },
        { amount: withFee(totalCents), base: totalCents },
      ].filter((p) => p.amount > 0);
      const allowed = allowedPairs.map((p) => p.amount);
      const TOLERANCE_CENTS = 100;
      const matchedPair = allowedPairs.find(
        (p) => Math.abs(p.amount - Number(amountTotalCents)) <= TOLERANCE_CENTS
      );
      const ok = !!matchedPair;
      if (!ok) {
        console.error(
          `[trip-checkout-create] REFUSED amount ${amountTotalCents}c for booking ${tripBookingId}; ` +
          `allowed (±$1): ${allowed.join(", ")}c (deposit=${depositCents}, balance=${balanceCents}, total=${totalCents})`
        );
        return new Response(
          JSON.stringify({
            error: "Payment amount does not match this booking. Please refresh the page and try again — if it persists, contact support.",
          }),
          { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
        );
      }
      matchedBaseCents = matchedPair!.base;
    }


    const tripRequest = (booking as any).trip_requests
      ? ((booking as any).trip_requests as any)
      : null;

    // Ownership: a request-based booking is owned by the trip request's user;
    // a marketplace booking is owned by the booking's traveler.
    const ownerId = tripRequest?.user_id ?? (booking as any).traveler_id;
    if (ownerId !== user.id) {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // -------------------------------------------------------------------
    // SOT RESIDENCY GATE (Jul 19): CA, FL, HI, IA, and WA require Seller
    // of Travel registration with extraterritorial reach (they apply when
    // selling travel to their residents, wherever the seller sits). Until
    // the host-agency / registration structure is live, trip purchases by
    // residents of those states are declined. The attested state arrives
    // from the purchase UI or was stamped on the booking at creation;
    // enforcement lives HERE so every checkout path is covered. Balance
    // payments on bookings that predate attestation are allowed (legacy
    // bookings carry no state and are already confirmed/paid).
    // -------------------------------------------------------------------
    const SOT_BLOCKED_STATES = ["CA", "FL", "HI", "IA", "WA"];
    const bookingMetaForGate = ((booking as any).metadata ?? {}) as any;
    const attestedState: string | undefined =
      residenceState ||
      (typeof bookingMetaForGate.residence_state === "string"
        ? bookingMetaForGate.residence_state.trim().toUpperCase()
        : undefined);
    const isPrePaymentBooking = !["confirmed", "paid_in_full", "completed"].includes(
      String(booking.status)
    );
    if (attestedState && SOT_BLOCKED_STATES.includes(attestedState)) {
      console.warn(
        `[trip-checkout-create] SOT gate declined booking ${tripBookingId}: attested state ${attestedState}`
      );
      return new Response(
        JSON.stringify({
          error:
            "Trip bookings aren't yet available to residents of California, Florida, Hawaii, Iowa, or Washington.",
          code: "SOT_STATE_BLOCKED",
        }),
        { status: 451, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }
    if (!attestedState && isPrePaymentBooking) {
      return new Response(
        JSON.stringify({
          error:
            "Please select your state of residence to continue. If this page has been open a while, refresh it and try again.",
          code: "RESIDENCE_REQUIRED",
        }),
        { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // -------------------------------------------------------------------
    // DIRECT-CHARGE RESOLUTION (v2.0): the AGENT is the merchant of
    // record. New bookings with a partner charge ON the partner's Standard
    // connected account, with Goldsainte's commission split out as an
    // application fee. Rules:
    //   1. New booking + partner → partner MUST be charges_enabled
    //      (verified LIVE against Stripe, never a cached flag) or checkout
    //      is declined with AGENT_NOT_READY.
    //   2. Legacy bookings whose deposit was platform-charged stay on the
    //      platform path end-to-end — charge models never mix per booking.
    //   3. Partnerless (platform/concierge) bookings stay platform-charged
    //      and are flagged in logs: they make Goldsainte the seller and
    //      should be retired or assigned to an agent.
    // -------------------------------------------------------------------
    let connectAccountId: string | null = null;
    // The independent travel professional who is the seller of record for this
    // trip. Used to label the receipt/line item as THEIR sale, not Goldsainte's.
    let sellerName: string | null = null;
    {
      const partnerId = (booking as any).partner_id as string | null;
      const priorDirect = bookingMetaForGate.charge_model === "direct";
      const legacyPlatformPaid = !isPrePaymentBooking && !priorDirect;

      if (partnerId && !legacyPlatformPaid) {
        const { data: partnerProfile } = await supabase
          .from("profiles")
          .select("stripe_account_id, stripe_connect_account_id, agency_name, display_name, full_name")
          .eq("id", partnerId)
          .maybeSingle();
        const acctId =
          (partnerProfile as any)?.stripe_account_id ||
          (partnerProfile as any)?.stripe_connect_account_id ||
          null;

        let ready = false;
        if (acctId) {
          try {
            const acct = await stripe.accounts.retrieve(acctId);
            ready = !!(acct as any).charges_enabled;
          } catch (e) {
            console.error(`[trip-checkout-create] account retrieve failed for ${acctId}:`, e);
          }
        }

        if (ready) {
          connectAccountId = acctId;
          sellerName =
            ((partnerProfile as any)?.agency_name ||
              (partnerProfile as any)?.display_name ||
              (partnerProfile as any)?.full_name ||
              "").trim() || null;
        } else if (isPrePaymentBooking) {
          return new Response(
            JSON.stringify({
              error:
                "This specialist isn't set up to accept payments yet. Send them a message — once they activate payments you'll be able to book right away.",
              code: "AGENT_NOT_READY",
            }),
            { status: 409, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
          );
        } else if (priorDirect) {
          // Balance payment on a direct-charge booking whose account has
          // gone un-ready: charging the platform instead would strand the
          // traveler's money on the wrong balance. Refuse and retry later.
          return new Response(
            JSON.stringify({
              error:
                "Your specialist's payment account is temporarily unavailable. Please try again shortly or contact support.",
              code: "AGENT_ACCOUNT_UNAVAILABLE",
            }),
            { status: 409, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
          );
        }
      } else if (!partnerId) {
        // Goldsainte Concierge (partnerless) inventory is INQUIRY-ONLY.
        // Goldsainte is not the seller of travel, so it must never be the
        // merchant of record on a trip. These trips are lead-gen: an inquiry
        // routes to an independent agent who becomes the seller. Refuse any
        // attempt to charge a partnerless trip, regardless of surface.
        console.warn(
          `[trip-checkout-create] Refused partnerless (Concierge) checkout ${tripBookingId} — inquiry-only, Goldsainte is not a seller of travel.`
        );
        return new Response(
          JSON.stringify({
            error:
              "This is a Goldsainte Concierge trip and isn't purchased directly. Use \u201cRequest this trip\u201d and we\u2019ll connect you with a travel agent in your area who can book it for you.",
            code: "CONCIERGE_INQUIRY_ONLY",
          }),
          { status: 409, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
        );
      }
    }

    // Application fee = charged amount minus the agent's 96.5% of the
    // slice base. Fee-inclusive charge (1.035×base): fee = 7% of base
    // (traveler 3.5% + host 3.5%). Bare-base charge: fee = 3.5% of base.
    // The agent absorbs Stripe processing, as the merchant of record.
    const applicationFeeCents = connectAccountId
      ? Math.max(0, Math.round(Number(amountTotalCents)) - Math.round(matchedBaseCents * 0.965))
      : 0;
    
    // -------------------------------------------------------------------
    // Lazy auto-link: if a contract exists for this (traveler, agent)
    // pair but isn't yet linked to a booking, link it now so the gate
    // below catches it. Only links unambiguous matches (exactly one
    // unlinked contract for the pair). Belt-and-suspenders to the SQL
    // trigger; either path leaves the contract linked. Fails open.
    // -------------------------------------------------------------------
    try {
      const travelerId  = (booking as any).traveler_id;
      const partnerId   = (booking as any).partner_id;
      const partnerRole = (booking as any).partner_role;
      const partnerIsAgent = !partnerRole || partnerRole !== "creator";

      if (travelerId && partnerId && partnerIsAgent) {
        const { data: candidateContracts } = await supabase
          .from("trip_contracts")
          .select("id")
          .eq("traveler_id", travelerId)
          .eq("agent_id", partnerId)
          .is("booking_id", null)
          .in("status", ["draft", "pending_signatures", "fully_executed"]);

        if (candidateContracts && candidateContracts.length === 1) {
          await supabase
            .from("trip_contracts")
            .update({
              booking_id: booking.id,
              updated_at: new Date().toISOString(),
            })
            .eq("id", candidateContracts[0].id);
        }
      }
    } catch (e) {
      console.error("Lazy contract link failed (non-fatal):", e);
    }

    // -------------------------------------------------------------------
    // Contract gate: if a trip_contracts row is linked to this booking,
    // -------------------------------------------------------------------
    // Contract gate: if a trip_contracts row is linked to this booking,
    // it must be fully_executed before deposit can be paid. Bookings
    // with no linked contract are unaffected. Fails open on query
    // errors so contract bugs never block legitimate revenue.
    // -------------------------------------------------------------------
    try {
      const { data: linkedContracts, error: contractGateError } = await supabase
        .from("trip_contracts")
        .select("id, status")
        .eq("booking_id", booking.id);

      if (contractGateError) {
        console.error("Contract gate query failed:", contractGateError);
      } else if (linkedContracts && linkedContracts.length > 0) {
        const executed = linkedContracts.some(
          (c: any) => c.status === "fully_executed"
        );
        if (!executed) {
          const pendingContract = linkedContracts.find(
            (c: any) => c.status === "pending_signatures" || c.status === "draft"
          );
          return new Response(
            JSON.stringify({
              error: "Contract not signed",
              message:
                "You must sign the trip contract before paying the deposit. Open the contract from your bookings dashboard or check your inbox for the signing link.",
              code: "CONTRACT_NOT_EXECUTED",
              contractId: pendingContract?.id ?? null,
            }),
            {
              status: 412,
              headers: {
                ...corsHeaders(req),
                "Content-Type": "application/json",
              },
            }
          );
        }
      }
    } catch (e) {
      console.error("Contract gate threw:", e);
    }

    // Best-effort enrichment for marketplace bookings: look up the packaged
    // trip's title + destination so Stripe records and the customer's receipt
    // carry real context instead of a generic "Goldsainte Trip" label.
    let tripTitle: string | null = null;
    let destination: string | null = tripRequest?.destination ?? null;

    if (!tripRequest) {
      const meta = ((booking as any).metadata ?? {}) as any;
      const tripIdFromMeta = meta?.trip_id;
      if (tripIdFromMeta) {
        try {
          const { data: pkg } = await supabase
            .from("packaged_trips")
            .select("title, destination")
            .eq("id", tripIdFromMeta)
            .maybeSingle();
          if (pkg) {
            tripTitle = (pkg as any).title ?? null;
            destination = (pkg as any).destination ?? destination;
          }
        } catch (_e) {
          // Never block checkout on enrichment failure.
        }
      }
    }

    // Human-friendly booking reference, shown on receipts and the Stripe
    // dashboard so support and the customer have a short ID to quote.
    const bookingRef = `GS-${booking.id.slice(0, 8).toUpperCase()}`;

    // Build a descriptive line-item name and Stripe payment-intent description.
    const sourceMetadata = tripRequest?.source_metadata as any;
    const collectionTitle = sourceMetadata?.collection_title;
    const brandName = sourceMetadata?.brand_name;

    // The line item names the SELLER OF RECORD (the independent travel
    // professional) — not Goldsainte — because on a direct charge they are the
    // merchant selling the trip. Goldsainte is named only as the platform it's
    // booked through. Falls back gracefully if the seller name is unavailable.
    const sellerLabel = sellerName || "your travel professional";
    const viaGoldsainte = " (booked via Goldsainte)";
    const lineItemName = tripTitle
      ? `${sellerLabel} — ${tripTitle}${destination ? ` (${destination})` : ""}`
      : `${sellerLabel} — Trip${
          collectionTitle ? ` — ${collectionTitle}` :
          brandName ? ` — ${brandName}` :
          destination ? ` to ${destination}` : ""
        }`;

    const lineItemDescription = `Deposit for ${tripTitle || "your trip"}${
      destination ? ` — ${destination}` : ""
    }${viaGoldsainte} • Sold by ${sellerLabel} • Ref ${bookingRef}`;

    const piDescription = tripTitle
      ? `${bookingRef} • ${tripTitle}${destination ? `, ${destination}` : ""} (deposit) • Sold by ${sellerLabel}`
      : `${bookingRef} • Deposit${destination ? ` — ${destination}` : ""} • Sold by ${sellerLabel}`;

    // Determine redirect URLs. The caller normally supplies these explicitly;
    // the fallback only applies if it doesn't.
    const publicSiteUrl = Deno.env.get("PUBLIC_SITE_URL") || "https://goldsainte.ai";
    const fallbackPath = tripRequest?.id ? `/trips/${tripRequest.id}` : "/marketplace";
    const successUrl = body.successUrl ||
      `${publicSiteUrl}${fallbackPath}?payment=success`;
    const cancelUrl = body.cancelUrl ||
      `${publicSiteUrl}${fallbackPath}?payment=cancelled`;

    // Create Stripe Checkout Session.
    //
    // Two key things vs. the previous version:
    //
    //   1. NO `capture_method: "manual"`. A deposit due today should capture
    //      immediately so the customer is actually charged, Stripe sends its
    //      automatic receipt, and `payment_intent.succeeded` can fire. The
    //      escrow / partner-payout split happens later via Stripe Connect
    //      transfers — not by holding the customer's funds uncaptured.
    //
    //   2. `customer_email` is set on the session. Stripe uses this to send
    //      the receipt and to create / link a Customer record so the payment
    //      is searchable by email in the Stripe dashboard.
    const sessionCreateParams: any = {
      mode: "payment",
      currency: currency.toLowerCase(),
      customer_email: user.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: lineItemName,
              description: lineItemDescription,
              metadata: {
                trip_request_id: tripRequest?.id ?? "",
                trip_booking_id: booking.id,
                booking_reference: bookingRef,
              },
            },
            unit_amount: amountTotalCents,
          },
        },
      ],
      success_url: `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      payment_intent_data: {
        ...(connectAccountId ? { application_fee_amount: applicationFeeCents } : {}),
        description: piDescription,
        metadata: {
          trip_booking_id: booking.id,
          trip_request_id: tripRequest?.id ?? "",
          booking_reference: bookingRef,
          trip_title: tripTitle ?? "",
          destination: destination ?? "",
          type: "trip_booking",
          ...(affiliateCode ? { affiliate_code: affiliateCode } : {}),
          ...(gclid ? { gclid } : {}),
          ...(attestedState ? { residence_state: attestedState } : {}),
          charge_model: connectAccountId ? "direct" : "platform",
          ...(connectAccountId ? { stripe_account: connectAccountId } : {}),
        },
      },
      metadata: {
        // These metadata keys must match what `stripe-webhook-handler` reads
        // in `handleCheckoutCompleted`: `type === 'trip_booking'` and
        // `trip_booking_id` — DO NOT rename them.
        type: "trip_booking",
        trip_booking_id: booking.id,
        trip_request_id: tripRequest?.id ?? "",
        proposal_id: booking.proposal_id || "",
        booking_reference: bookingRef,
        trip_title: tripTitle ?? "",
        destination: destination ?? "",
        ...(affiliateCode ? { affiliate_code: affiliateCode } : {}),
        ...(gclid ? { gclid } : {}),
        ...(attestedState ? { residence_state: attestedState } : {}),
        charge_model: connectAccountId ? "direct" : "platform",
        ...(connectAccountId ? { stripe_account: connectAccountId } : {}),
      },
    };

    // Direct charge on the agent's Standard account (Goldsainte's cut as
    // an application fee) — or platform charge for legacy/platform paths.
    // SELLER-OF-RECORD INVARIANT: a trip is always sold by, and charged to, the
    // independent travel professional's own Stripe account. Goldsainte is never
    // the merchant of record on a trip. Every upstream path either resolves a
    // ready connected account or returns before here (AGENT_NOT_READY,
    // AGENT_ACCOUNT_UNAVAILABLE, CONCIERGE_INQUIRY_ONLY). If we somehow reach
    // this point without a connected account, we REFUSE rather than fall back to
    // charging the platform — there is deliberately no platform-charge path.
    if (!connectAccountId) {
      console.error(
        `[trip-checkout-create] Refused checkout ${tripBookingId}: no connected account resolved at charge time. ` +
          `Goldsainte will not act as merchant of record for a trip.`
      );
      return new Response(
        JSON.stringify({
          error:
            "This trip can only be paid to your travel professional's own account, and it isn't available right now. Please try again shortly or contact support.",
          code: "NO_SELLER_ACCOUNT",
        }),
        { status: 409, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Direct charge on the travel professional's Standard account, with
    // Goldsainte's commission taken as an application fee. This is the only
    // charge path.
    const session = await stripe.checkout.sessions.create(
      sessionCreateParams,
      { stripeAccount: connectAccountId }
    );

    // Update booking with payment details.
    //
    // We intentionally do NOT overwrite `total_price` (it was set to the
    // trip's price-per-person on insert and represents the trip cost; the
    // deposit-charged amount lives on the Stripe payment record). We store
    // `session.payment_intent` (a `pi_…` id) — not `session.id` (`cs_…`) —
    // so refund / dispute lookups against `stripe_payment_intent_id` match
    // what Stripe sends in those events.
    const { data: updated, error: updateError } = await supabase
      .from("trip_bookings")
      .update({
        currency: currency.toLowerCase(),
        payment_provider: "stripe",
        stripe_payment_intent_id: (session as any).payment_intent ?? session.id,
        payment_url: session.url,
        // v1.1: only PRE-payment bookings move to payment_pending. A balance
        // checkout on a CONFIRMED booking must not regress it — backing out
        // of Stripe was flipping confirmed bookings to "Awaiting payment"
        // and re-offering the already-paid deposit (a double-charge trap).
        ...(["confirmed", "paid_in_full", "completed"].includes(String(booking.status))
          ? {}
          : { status: "payment_pending" }),
        metadata: {
          ...((booking.metadata as any) || {}),
          checkout_session_id: session.id,
          checkout_session_created_at: new Date().toISOString(),
          booking_reference: bookingRef,
          ...(tripTitle ? { trip_title: tripTitle } : {}),
          ...(destination ? { destination } : {}),
          ...(attestedState
            ? {
                residence_state: attestedState,
                residence_attested_at:
                  bookingMetaForGate.residence_attested_at ?? new Date().toISOString(),
              }
            : {}),
          charge_model: connectAccountId ? "direct" : "platform",
          ...(connectAccountId
            ? {
                stripe_account: connectAccountId,
                application_fee_cents: applicationFeeCents,
              }
            : {}),
        },
      })
      .eq("id", booking.id)
      .select("id, payment_url, status")
      .single();

    if (updateError || !updated) {
      throw updateError ?? new Error("Failed to update booking");
    }

    return new Response(
      JSON.stringify({
        bookingId: updated.id,
        paymentUrl: updated.payment_url,
        status: updated.status,
        bookingReference: bookingRef,
      }),
      {
        status: 200,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("trip-checkout-create error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" }
      }
    );
  }
});
