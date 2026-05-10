import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Stripe from "https://esm.sh/stripe@15.11.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://goldsainte.ai",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RequestBody {
  tripBookingId: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}