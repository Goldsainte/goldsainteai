import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Stripe from "https://esm.sh/stripe@15.11.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://goldsainte.ai",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RequestBody {
  tripBookingId: string;
  amountTotalCents: number;
  currency?: string;
  successUrl?: string;
  cancelUrl?: string;
  affiliateCode?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = (await req.json()) as RequestBody;
    const { tripBookingId, amountTotalCents, currency = "usd" } = body;
    const affiliateCode =
      typeof body.affiliateCode === "string" &&
      /^[a-zA-Z0-9_-]{3,64}$/.test(body.affiliateCode)
        ? body.affiliateCode
        : undefined;

    if (!tripBookingId || !amountTotalCents || amountTotalCents <= 0) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid payload" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
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

    // Load booking with trip request details
    const { data: booking, error: bookingError } = await supabase
      .from("trip_bookings")
      .select(`
        id,
        trip_request_id,
        proposal_id,
        currency,
        total_price,
        metadata,
        trip_requests!inner (
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

    if ((booking.trip_requests as any).user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build descriptive line item name from trip context
    const tripRequest = booking.trip_requests as any;
    const sourceMetadata = tripRequest.source_metadata as any;
    const collectionTitle = sourceMetadata?.collection_title;
    const brandName = sourceMetadata?.brand_name;
    const destination = tripRequest.destination;

    const lineItemName = `Goldsainte Trip${
      collectionTitle ? ` – ${collectionTitle}` : 
      brandName ? ` – ${brandName}` : 
      destination ? ` to ${destination}` : ""
    }`;

    // Determine redirect URLs
    const publicSiteUrl = Deno.env.get("PUBLIC_SITE_URL") || "https://goldsainte.ai";
    const successUrl = body.successUrl || 
      `${publicSiteUrl}/trips/${tripRequest.id}?payment=success`;
    const cancelUrl = body.cancelUrl || 
      `${publicSiteUrl}/trips/${tripRequest.id}?payment=cancelled`;

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      currency: currency.toLowerCase(),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: lineItemName,
              description: `Trip booking for ${destination || "custom itinerary"}`,
      metadata: {
        trip_request_id: tripRequest.id,
        trip_booking_id: booking.id,
      },
            },
            unit_amount: amountTotalCents,
          },
        },
      ],
      success_url: `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      payment_intent_data: {
        capture_method: "manual",
        metadata: {
          trip_booking_id: booking.id,
          trip_request_id: tripRequest.id,
          type: "trip_booking",
          ...(affiliateCode ? { affiliate_code: affiliateCode } : {}),
        },
      },
      metadata: {
        trip_request_id: tripRequest.id,
        trip_booking_id: booking.id,
        proposal_id: booking.proposal_id || "",
        type: "trip_booking",
        ...(affiliateCode ? { affiliate_code: affiliateCode } : {}),
      },
    });

    // Update booking with payment details
    const { data: updated, error: updateError } = await supabase
      .from("trip_bookings")
      .update({
        total_price: amountTotalCents,
        currency: currency.toLowerCase(),
        payment_provider: "stripe",
        stripe_payment_intent_id: session.id,
        payment_url: session.url,
        status: "payment_pending",
        metadata: {
          ...((booking.metadata as any) || {}),
          checkout_session_created_at: new Date().toISOString(),
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
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
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
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
