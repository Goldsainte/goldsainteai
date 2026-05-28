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
        currency,
        total_price,
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

    // Build a descriptive line item name from whatever trip context we have.
    const sourceMetadata = tripRequest?.source_metadata as any;
    const collectionTitle = sourceMetadata?.collection_title;
    const brandName = sourceMetadata?.brand_name;
    const destination = tripRequest?.destination ?? null;

    const lineItemName = `Goldsainte Trip${
      collectionTitle ? ` – ${collectionTitle}` :
      brandName ? ` – ${brandName}` :
      destination ? ` to ${destination}` : ""
    }`;

    // Determine redirect URLs. The caller normally supplies these explicitly;
    // the fallback only applies if it doesn't.
    const publicSiteUrl = Deno.env.get("PUBLIC_SITE_URL") || "https://goldsainte.ai";
    const fallbackPath = tripRequest?.id ? `/trips/${tripRequest.id}` : "/marketplace";
    const successUrl = body.successUrl ||
      `${publicSiteUrl}${fallbackPath}?payment=success`;
    const cancelUrl = body.cancelUrl ||
      `${publicSiteUrl}${fallbackPath}?payment=cancelled`;

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
              description: `Trip booking for ${destination || "your Goldsainte trip"}`,
              metadata: {
                trip_request_id: tripRequest?.id ?? "",
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
          trip_request_id: tripRequest?.id ?? "",
          type: "trip_booking",
          ...(affiliateCode ? { affiliate_code: affiliateCode } : {}),
          ...(gclid ? { gclid } : {}),
        },
      },
      metadata: {
        trip_request_id: tripRequest?.id ?? "",
        trip_booking_id: booking.id,
        proposal_id: booking.proposal_id || "",
        type: "trip_booking",
        ...(affiliateCode ? { affiliate_code: affiliateCode } : {}),
        ...(gclid ? { gclid } : {}),
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
