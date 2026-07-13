// ============================================================================
// release-trip-deposit v4 — MILESTONE ESCROW
// ============================================================================
// The combined model (decided Jul 11): traveler money sits with Goldsainte
// and is released in up to two milestones, each paying 96.5% of its slice
// (partner-side fee 3.5%; the traveler-side 3.5% was charged on top at
// checkout — 7% platform total):
//
//   release_deposit  — TRAVELER (owner) or ADMIN fallback. The partner's
//                      working capital, released by the traveler once the
//                      partner has shown them confirmed reservations.
//   release_final    — TRAVELER (owner) or ADMIN. Fiverr-style consent:
//                      the traveler confirms the trip is complete, the
//                      remainder releases, booking stamps completed.
//   request_release  — PARTNER. Moves no money. Bells the traveler and
//                      stamps release_requested_* on the booking so the
//                      admin Bookings room shows the request.
//
// Every release writes a row to trip_payouts (unique per booking+milestone,
// so double-release is impossible) and updates the booking's cumulative
// partner_payout / platform_commission. payout_paid_at + status 'completed'
// are stamped only by the FINAL release.
//
// v4 also hardens v3's honesty: if the partner has no connected Stripe
// account, or the transfer fails, the release FAILS with a real message —
// v2/v3 would stamp the booking released while no money had moved.
//
// Legacy safety: a request body without an `action` (a stale partner page)
// is treated as request_release when the caller is the partner — it can
// never move money.
// ============================================================================

import "../_shared/resend-guard.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Stripe from "https://esm.sh/stripe@15.11.0?target=deno";
import { resolveAllowedOrigin } from "../_shared/cors.ts";
import {
  round2,
  toCents,
  totalPartnerPayout,
  depositMilestone,
  finalMilestone,
} from "../_shared/payoutMath.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
}

function json(req: Request, payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

interface RequestBody {
  tripBookingId: string;
  action?: "release_deposit" | "release_final" | "request_release";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json(req, { error: "Unauthorized" }, 401);
    }
    const token = authHeader.replace("Bearer ", "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey);
    const { data: { user }, error: authError } = await userClient.auth.getUser(token);
    if (authError || !user) return json(req, { error: "Unauthorized" }, 401);

    const body = (await req.json()) as RequestBody;
    if (!body?.tripBookingId) return json(req, { error: "tripBookingId required" }, 400);

    const admin = createClient(supabaseUrl, serviceKey);

    // Load booking (metadata included so updates MERGE it, never clobber)
    const { data: booking, error: bookingError } = await admin
      .from("trip_bookings")
      .select("id, traveler_id, partner_id, total_price, deposit_amount, currency, stripe_payment_intent_id, status, metadata")
      .eq("id", body.tripBookingId)
      .single();

    if (bookingError || !booking) {
      return json(req, { error: "Booking not found" }, 404);
    }

    // Who is calling?
    const { data: isAdminData } = await admin.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    const isAdmin = !!isAdminData;
    const isPartner = !!booking.partner_id && booking.partner_id === user.id;
    const isTraveler = booking.traveler_id === user.id;
    if (!isAdmin && !isPartner && !isTraveler) {
      return json(req, { error: "Forbidden" }, 403);
    }

    // Legacy safety: no action from a partner = request, never a release.
    const action: RequestBody["action"] =
      body.action ?? (isPartner ? "request_release" : undefined);
    if (!action || !["release_deposit", "release_final", "request_release"].includes(action)) {
      return json(req, { error: "action required: release_deposit | release_final | request_release" }, 400);
    }

    const total = Number(booking.total_price);
    const deposit = Number(booking.deposit_amount ?? 0);
    const currency = (booking.currency || "usd").toLowerCase();
    const meta = (booking.metadata as Record<string, unknown>) ?? {};
    const tripTitle = (meta as any)?.trip_title || "the trip";

    const bell = async (userId: string, title: string, message: string, actionUrl: string) => {
      try {
        const { error } = await admin.from("notifications").insert({
          user_id: userId,
          type: "system_announcement",
          title,
          message,
          action_url: actionUrl,
          entity_type: "trip_booking",
          entity_id: booking.id,
        });
        if (error) console.error("Notification insert failed:", error.message);
      } catch (e) {
        console.error("Notification insert threw:", e);
      }
    };

    // ── PARTNER: request a release (no money moves) ──
    if (action === "request_release") {
      if (!isPartner && !isAdmin) {
        return json(req, { error: "Only the booking's partner can request a release" }, 403);
      }
      const { error: metaError } = await admin
        .from("trip_bookings")
        .update({
          updated_at: new Date().toISOString(),
          metadata: {
            ...meta,
            release_requested_at: new Date().toISOString(),
            release_requested_by: user.id,
          },
        })
        .eq("id", booking.id);
      if (metaError) {
        return json(req, { error: `Could not record the request: ${metaError.message}` }, 500);
      }
      await bell(
        booking.traveler_id,
        "Your specialist requested payment release",
        `Your specialist has asked to release payment for ${tripTitle}. Once they've shared confirmed reservations you can release their working capital from your booking page — and confirm the trip there when it's complete.`,
        `/bookings/${booking.id}`
      );
      return json(req, {
        success: true,
        message: "Request sent — the traveler and Goldsainte have been notified.",
      });
    }

    // ── Releases below: money moves. Authorize per milestone. ──
    if (action === "release_deposit" && !isAdmin && !isTraveler) {
      return json(req, { error: "Only the traveler or Goldsainte can release the deposit milestone" }, 403);
    }
    if (action === "release_final" && !isAdmin && !isTraveler) {
      return json(req, { error: "Only the traveler or Goldsainte can release the final payment" }, 403);
    }

    if (!Number.isFinite(total) || total <= 0) {
      return json(req, { error: "Booking has no valid total_price — cannot compute payout" }, 400);
    }
    if (!booking.stripe_payment_intent_id) {
      return json(req, { error: "No payment intent on this booking" }, 400);
    }
    if (!booking.partner_id) {
      return json(req, { error: "This booking has no partner to pay" }, 400);
    }

    // Existing ledger for this booking
    const { data: ledger, error: ledgerError } = await admin
      .from("trip_payouts")
      .select("milestone, base_amount, payout_amount, platform_fee")
      .eq("trip_booking_id", booking.id);
    if (ledgerError) {
      return json(req, { error: `Could not read the payout ledger: ${ledgerError.message}` }, 500);
    }
    const depositRow = (ledger ?? []).find((r) => r.milestone === "deposit");
    const finalRow = (ledger ?? []).find((r) => r.milestone === "final");
    if (finalRow) {
      return json(req, { error: "This booking is already fully released" }, 400);
    }

    // Milestone math — payoutMath guarantees the two milestones sum
    // EXACTLY to 96.5% of total (behavioral tests prove it).
    const totalPayout = totalPartnerPayout(total);
    let base: number;
    let payout: number;
    if (action === "release_deposit") {
      if (depositRow) {
        return json(req, { error: "The deposit milestone was already released" }, 400);
      }
      if (!(deposit > 0)) {
        return json(req, { error: "This booking has no deposit amount — release the final payment instead" }, 400);
      }
      if (!["confirmed", "paid_in_full"].includes(booking.status)) {
        return json(req, { error: `Deposit can be released once the deposit is paid (booking status: ${booking.status})` }, 400);
      }
      const m = depositMilestone(total, deposit);
      base = m.base;
      payout = m.payout;
    } else {
      // release_final
      const balance = round2(total - deposit);
      const balanceCollected =
        booking.status === "paid_in_full" ||
        (booking.status === "confirmed" && balance <= 0) ||
        booking.status === "completed";
      if (!balanceCollected) {
        return json(req, { error: `The trip balance hasn't been paid yet (booking status: ${booking.status}) — collect it before releasing` }, 400);
      }
      const m = finalMilestone(
        total,
        Number(depositRow?.base_amount ?? 0),
        Number(depositRow?.payout_amount ?? 0)
      );
      base = m.base;
      payout = m.payout;
      if (payout <= 0) {
        return json(req, { error: "Nothing left to release on this booking" }, 400);
      }
    }
    const fee = round2(base - payout);

    // Partner must have a connected Stripe account — otherwise the release
    // would stamp paid while no money moved. Fail honestly instead.
    const { data: partnerProfile } = await admin
      .from("profiles")
      .select("stripe_account_id, stripe_connect_account_id")
      .eq("id", booking.partner_id)
      .maybeSingle();
    // Jul 13: profiles is the ONE home for Connect account ids (agents and
    // creators alike). The Jul 12 travel_agents fallback referenced a column
    // that never existed on the live table — removed.
    const connectAccountId: string | undefined =
      partnerProfile?.stripe_account_id || partnerProfile?.stripe_connect_account_id;
    if (!connectAccountId) {
      return json(req, { error: "The partner has no connected Stripe account yet — they need to connect one before payouts can be released" }, 400);
    }

    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecret) return json(req, { error: "STRIPE_SECRET_KEY not configured" }, 500);
    const stripe = new Stripe(stripeSecret, { apiVersion: "2024-06-20" });

    // The stored stripe_payment_intent_id from trip-checkout-create is
    // actually a session id — resolve to the real payment intent if needed.
    let paymentIntentId = booking.stripe_payment_intent_id;
    if (paymentIntentId.startsWith("cs_")) {
      const session = await stripe.checkout.sessions.retrieve(paymentIntentId);
      if (!session.payment_intent || typeof session.payment_intent !== "string") {
        return json(req, { error: "Could not resolve payment intent from session" }, 500);
      }
      paymentIntentId = session.payment_intent;
    }

    // Ensure the charge is captured (checkout normally auto-captures)
    try {
      await stripe.paymentIntents.capture(paymentIntentId);
    } catch (e: any) {
      if (!String(e?.message || "").toLowerCase().includes("already")) {
        console.error("Capture failed", e);
        return json(req, { error: `Capture failed: ${e.message}` }, 500);
      }
    }

    // Transfer the milestone payout — Stripe amounts are in CENTS.
    let transferId: string;
    try {
      const transfer = await stripe.transfers.create({
        amount: toCents(payout),
        currency,
        destination: connectAccountId,
        metadata: {
          trip_booking_id: booking.id,
          partner_id: booking.partner_id,
          milestone: action === "release_deposit" ? "deposit" : "final",
          type: "trip_booking_payout",
        },
      });
      transferId = transfer.id;
    } catch (e: any) {
      console.error("Transfer failed", e);
      return json(req, { error: `Stripe transfer failed — nothing was released: ${e.message}` }, 500);
    }

    // Record the milestone in the ledger (unique index blocks double release)
    const milestone = action === "release_deposit" ? "deposit" : "final";
    const releasedVia = isAdmin ? "admin" : "traveler_confirmation";
    const { error: insertError } = await admin.from("trip_payouts").insert({
      trip_booking_id: booking.id,
      milestone,
      base_amount: base,
      payout_amount: payout,
      platform_fee: fee,
      stripe_transfer_id: transferId,
      released_by: user.id,
      released_via: releasedVia,
    });
    if (insertError) {
      // Money moved but the ledger write failed — say exactly that.
      return json(req, { error: `Transfer ${transferId} succeeded but recording it failed: ${insertError.message}. Do NOT retry — reconcile in Stripe.` }, 500);
    }

    // Update the booking's cumulative money facts
    const cumulativePayout = round2(Number(depositRow?.payout_amount ?? 0) + payout);
    const cumulativeFee = round2(Number(depositRow?.platform_fee ?? 0) + fee);
    const bookingUpdate: Record<string, unknown> =
      milestone === "final"
        ? {
            status: "completed",
            partner_payout: cumulativePayout,
            platform_commission: cumulativeFee,
            payout_paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            metadata: {
              ...meta,
              released_by: user.id,
              released_at: new Date().toISOString(),
              stripe_transfer_id: transferId,
            },
          }
        : {
            partner_payout: cumulativePayout,
            platform_commission: cumulativeFee,
            updated_at: new Date().toISOString(),
            metadata: {
              ...meta,
              deposit_released_at: new Date().toISOString(),
              deposit_released_by: user.id,
              deposit_stripe_transfer_id: transferId,
            },
          };

    const { error: updateError } = await admin
      .from("trip_bookings")
      .update(bookingUpdate)
      .eq("id", booking.id);
    if (updateError) {
      return json(req, { error: `Released and recorded, but the booking update failed: ${updateError.message}` }, 500);
    }

    // Bells
    const displayCur = currency.toUpperCase();
    if (milestone === "deposit") {
      await bell(
        booking.partner_id,
        "Working capital released",
        `Your deposit payout of ${displayCur} ${payout.toFixed(2)} for ${tripTitle} has been released so you can secure the reservations.`,
        `/booking/${booking.id}`
      );
    } else {
      await bell(
        booking.partner_id,
        "Final payout released",
        `Your final payout of ${displayCur} ${payout.toFixed(2)} for ${tripTitle} has been released. Total received: ${displayCur} ${cumulativePayout.toFixed(2)}.`,
        `/booking/${booking.id}`
      );
      if (isAdmin) {
        await bell(
          booking.traveler_id,
          "Trip payment released",
          `Payment for ${tripTitle} has been released to your specialist. We hope it was wonderful.`,
          `/bookings/${booking.id}`
        );
      }
      // Fire-and-forget: ask the traveler to leave a review.
      try {
        await sendReviewRequestEmail(admin, booking.id);
      } catch (e) {
        console.error("review request email failed", e);
      }
    }

    return json(req, {
      success: true,
      milestone,
      payoutAmount: payout,
      cumulativePayout,
      transferId,
      message:
        milestone === "deposit"
          ? `Deposit milestone released — ${displayCur} ${payout.toFixed(2)} sent to the partner.`
          : `Final milestone released — ${displayCur} ${payout.toFixed(2)} sent. Booking complete.`,
    });
  } catch (err: any) {
    console.error("release-trip-deposit error", err);
    return json(req, { error: err?.message || "Internal error" }, 500);
  }
});

async function sendReviewRequestEmail(admin: ReturnType<typeof createClient>, bookingId: string) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    console.warn("RESEND_API_KEY not configured; skipping review request email");
    return;
  }

  // Pull traveler + agent details
  const { data: booking } = await admin
    .from("trip_bookings")
    .select("id, traveler_id, partner_id")
    .eq("id", bookingId)
    .single();
  if (!booking?.traveler_id) return;

  const [{ data: travelerAuth }, { data: travelerProfile }, { data: agentProfile }] = await Promise.all([
    admin.auth.admin.getUserById(booking.traveler_id),
    admin.from("profiles").select("full_name, display_name, first_name").eq("id", booking.traveler_id).maybeSingle(),
    booking.partner_id
      ? admin.from("profiles").select("full_name, display_name").eq("id", booking.partner_id).maybeSingle()
      : Promise.resolve({ data: null } as any),
  ]);

  const travelerEmail = travelerAuth?.user?.email;
  if (!travelerEmail) return;

  const travelerName =
    travelerProfile?.first_name ||
    travelerProfile?.display_name ||
    travelerProfile?.full_name ||
    "there";
  const agentName = agentProfile?.display_name || agentProfile?.full_name || "your travel specialist";
  const reviewUrl = `https://goldsainte.ai/reviews/new?booking=${booking.id}`;

  const html = `
    <div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; background:#f7f3ea; padding:32px;">
      <div style="max-width:560px; margin:0 auto; background:#ffffff; border:1px solid #E5DFC6; border-radius:16px; padding:32px;">
        <h1 style="font-family: Georgia, 'Times New Roman', serif; color:#0a2225; font-size:22px; margin:0 0 16px;">How was your trip, ${travelerName}?</h1>
        <p style="color:#3f3f3f; font-size:15px; line-height:1.6; margin:0 0 20px;">
          Now that your journey is wrapped, we'd love to hear how it went. Leave a review for
          <strong>${agentName}</strong> — it helps other travelers and rewards great specialists.
        </p>
        <p style="margin:28px 0;">
          <a href="${reviewUrl}" style="display:inline-block; background:#0c4d47; color:#bfad72; text-decoration:none; padding:12px 22px; border-radius:999px; font-weight:600; font-size:14px;">
            Leave a review
          </a>
        </p>
        <p style="color:#7a7151; font-size:12px; margin:24px 0 0;">— The Goldsainte team</p>
      </div>
    </div>
  `;

  const subject = `How was your trip? Leave a review for ${agentName}`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Goldsainte <hello@goldsainte.com>",
      to: [travelerEmail],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error("resend send failed", res.status, txt);
  }
}
