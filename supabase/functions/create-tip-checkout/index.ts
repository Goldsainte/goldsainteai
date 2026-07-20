// create-tip-checkout v1.0 (2026-07-20) — one-tap TIP to a creator or agent.
//
// A tip is the platform's simplest product: a fixed traveler-chosen amount
// paid DIRECTLY to the recipient's own Stripe account (they are the merchant
// of record), with Goldsainte's flat platform fee (3.5%) taken as a Stripe
// application_fee. No scheduling, no deliverable, no proposal — it reuses the
// exact direct-charge model the trip rail uses, so it inherits the same legal
// posture: Goldsainte never holds the money and is never the seller.
//
// Guardrails:
//   • Recipient MUST have a charges_enabled Stripe account (verified live).
//   • Amount is clamped to a sane range ($1–$500) to avoid fat-finger/abuse.
//   • Self-tipping is blocked.
//   • The tipper's identity (if signed in) is stamped for the record.

import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { buildCorsHeaders } from "../_shared/cors.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

const TIP_FEE_RATE = 0.035; // Goldsainte's flat platform fee on tips
const MIN_TIP_CENTS = 100; // $1
const MAX_TIP_CENTS = 50000; // $500

Deno.serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    const recipientId: string | undefined =
      typeof body.recipientId === "string" ? body.recipientId : undefined;
    const amountCents = Math.round(Number(body.amountCents));
    const note: string | undefined =
      typeof body.note === "string" ? body.note.slice(0, 200) : undefined;
    const successUrl: string | undefined =
      typeof body.successUrl === "string" ? body.successUrl : undefined;
    const cancelUrl: string | undefined =
      typeof body.cancelUrl === "string" ? body.cancelUrl : undefined;

    if (!recipientId) {
      return json(cors, { error: "Missing recipient.", code: "NO_RECIPIENT" }, 400);
    }
    if (!Number.isFinite(amountCents) || amountCents < MIN_TIP_CENTS || amountCents > MAX_TIP_CENTS) {
      return json(
        cors,
        { error: "Please choose a tip between $1 and $500.", code: "BAD_AMOUNT" },
        400
      );
    }

    // Identify the tipper if a bearer token was sent (optional — tips can be
    // sent while signed in; anonymous tips are allowed but recorded as such).
    let tipperId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const { data: userData } = await supabase.auth.getUser(
        authHeader.replace("Bearer ", "")
      );
      tipperId = userData?.user?.id ?? null;
    }

    if (tipperId && tipperId === recipientId) {
      return json(cors, { error: "You can't tip yourself.", code: "SELF_TIP" }, 400);
    }

    // Resolve the recipient's Stripe account and verify it can accept charges.
    const { data: recipient } = await supabase
      .from("profiles")
      .select("stripe_account_id, stripe_connect_account_id, display_name, full_name")
      .eq("id", recipientId)
      .maybeSingle();

    const acctId =
      (recipient as any)?.stripe_account_id ||
      (recipient as any)?.stripe_connect_account_id ||
      null;

    if (!acctId) {
      return json(
        cors,
        {
          error:
            "This person isn't set up to receive tips yet. Once they activate payments, you'll be able to send one.",
          code: "RECIPIENT_NOT_READY",
        },
        409
      );
    }

    let ready = false;
    try {
      const acct = await stripe.accounts.retrieve(acctId);
      ready = !!(acct as any).charges_enabled;
    } catch (e) {
      console.error(`[create-tip-checkout] account retrieve failed for ${acctId}:`, e);
    }
    if (!ready) {
      return json(
        cors,
        {
          error:
            "This person's payment account isn't active yet, so tips can't be sent right now.",
          code: "RECIPIENT_NOT_READY",
        },
        409
      );
    }

    const recipientName =
      (recipient as any)?.display_name || (recipient as any)?.full_name || "your creator";
    const applicationFeeCents = Math.round(amountCents * TIP_FEE_RATE);
    const origin =
      req.headers.get("origin") || "https://goldsainte.ai";

    // Direct charge ON the recipient's connected account — they are the
    // merchant of record; Goldsainte's fee is the application_fee.
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Tip for ${recipientName}`,
                ...(note ? { description: note } : {}),
              },
              unit_amount: amountCents,
            },
            quantity: 1,
          },
        ],
        payment_intent_data: {
          application_fee_amount: applicationFeeCents,
          description: `Goldsainte tip for ${recipientName}`,
          metadata: {
            kind: "tip",
            recipient_id: recipientId,
            ...(tipperId ? { tipper_id: tipperId } : {}),
            stripe_account: acctId,
          },
        },
        metadata: {
          kind: "tip",
          recipient_id: recipientId,
          ...(tipperId ? { tipper_id: tipperId } : {}),
        },
        success_url:
          successUrl || `${origin}/creators/${recipientId}?tip=success`,
        cancel_url: cancelUrl || `${origin}/creators/${recipientId}?tip=cancelled`,
      },
      { stripeAccount: acctId }
    );

    return json(cors, { url: session.url }, 200);
  } catch (err) {
    console.error("[create-tip-checkout] error:", err);
    return json(
      { "Content-Type": "application/json" },
      { error: "Couldn't start the tip. Please try again.", code: "TIP_ERROR" },
      500
    );
  }
});

function json(
  cors: Record<string, string>,
  bodyObj: unknown,
  status: number
): Response {
  return new Response(JSON.stringify(bodyObj), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
