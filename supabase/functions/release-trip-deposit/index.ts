import "../_shared/resend-guard.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Stripe from "https://esm.sh/stripe@15.11.0?target=deno";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
}

interface RequestBody {
  tripBookingId: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }
    const token = authHeader.replace("Bearer ", "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey);
    const { data: { user }, error: authError } = await userClient.auth.getUser(token);
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    const body = (await req.json()) as RequestBody;
    if (!body?.tripBookingId) return json({ error: "tripBookingId required" }, 400);

    const admin = createClient(supabaseUrl, serviceKey);

    // Load booking
    const { data: booking, error: bookingError } = await admin
      .from("trip_bookings")
      .select("id, partner_id, total_price, currency, stripe_payment_intent_id, status")
      .eq("id", body.tripBookingId)
      .single();

    if (bookingError || !booking) {
      return json({ error: "Booking not found" }, 404);
    }

    // Authorize: admin OR booking partner
    const { data: isAdminData } = await admin.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    const isAdmin = !!isAdminData;
    const isPartner = booking.partner_id && booking.partner_id === user.id;
    if (!isAdmin && !isPartner) {
      return json({ error: "Forbidden" }, 403);
    }

    if (!booking.stripe_payment_intent_id) {
      return json({ error: "No payment intent on this booking" }, 400);
    }

    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecret) return json({ error: "STRIPE_SECRET_KEY not configured" }, 500);
    const stripe = new Stripe(stripeSecret, { apiVersion: "2024-06-20" });

    // The stored stripe_payment_intent_id from trip-checkout-create is actually a session id.
    // Resolve it to the real payment intent if necessary.
    let paymentIntentId = booking.stripe_payment_intent_id;
    if (paymentIntentId.startsWith("cs_")) {
      const session = await stripe.checkout.sessions.retrieve(paymentIntentId);
      if (!session.payment_intent || typeof session.payment_intent !== "string") {
        return json({ error: "Could not resolve payment intent from session" }, 500);
      }
      paymentIntentId = session.payment_intent;
    }

    // Capture (release escrow)
    let capturedAmount = booking.total_price;
    try {
      const captured = await stripe.paymentIntents.capture(paymentIntentId);
      capturedAmount = captured.amount_received ?? booking.total_price;
    } catch (e: any) {
      // If already captured, continue
      if (!String(e?.message || "").toLowerCase().includes("already")) {
        console.error("Capture failed", e);
        return json({ error: `Capture failed: ${e.message}` }, 500);
      }
    }

    const total = booking.total_price;
    const partnerPayout = Math.round(total * 0.85);
    const platformCommission = total - partnerPayout;

    // Optional: Stripe Connect transfer to partner
    let transferId: string | null = null;
    if (booking.partner_id) {
      const { data: partnerProfile } = await admin
        .from("profiles")
        .select("stripe_account_id, stripe_connect_account_id")
        .eq("id", booking.partner_id)
        .maybeSingle();

      const connectAccountId =
        partnerProfile?.stripe_account_id || partnerProfile?.stripe_connect_account_id;

      if (connectAccountId) {
        try {
          const transfer = await stripe.transfers.create({
            amount: partnerPayout,
            currency: (booking.currency || "usd").toLowerCase(),
            destination: connectAccountId,
            metadata: {
              trip_booking_id: booking.id,
              partner_id: booking.partner_id,
              type: "trip_booking_payout",
            },
          });
          transferId = transfer.id;
        } catch (e: any) {
          console.error("Transfer failed", e);
          // Non-fatal: capture succeeded; surface as warning
        }
      }
    }

    // Update booking
    const { error: updateError } = await admin
      .from("trip_bookings")
      .update({
        status: "completed",
        partner_payout: partnerPayout,
        platform_commission: platformCommission,
        payout_paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          released_by: user.id,
          released_at: new Date().toISOString(),
          stripe_transfer_id: transferId,
        },
      })
      .eq("id", booking.id);

    if (updateError) {
      return json({ error: `DB update failed: ${updateError.message}` }, 500);
    }

    // Fire-and-forget: ask the traveler to leave a review.
    try {
      await sendReviewRequestEmail(admin, booking.id);
    } catch (e) {
      console.error("review request email failed", e);
    }

    return json({
      success: true,
      bookingId: booking.id,
      capturedAmount,
      partnerPayout,
      platformCommission,
      transferId,
    });
  } catch (err: any) {
    console.error("release-trip-deposit error", err);
    return json({ error: err?.message || "Internal error" }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

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
      from: "Goldsainte <noreply@notify.goldsainte.com>",
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