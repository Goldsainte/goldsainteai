import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { sessionId } = await req.json();
    
    console.log("Verifying payment for session:", sessionId);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ 
        success: false,
        message: "Payment not completed" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Parse booking data from metadata
    const bookingData = JSON.parse(session.metadata.booking_data);
    const userId = session.metadata.user_id !== "guest" ? session.metadata.user_id : null;

    // Create booking record
    const { data: booking, error: bookingError } = await supabaseClient
      .from("bookings")
      .insert({
        user_id: userId,
        booking_type: bookingData.bookingType,
        booking_data: bookingData,
        total_price: session.amount_total / 100,
        currency: session.currency.toUpperCase(),
        status: "confirmed",
        booking_reference: `GS-${Date.now()}`,
      })
      .select()
      .single();

    if (bookingError) {
      console.error("Error creating booking:", bookingError);
      throw bookingError;
    }

    console.log("Booking created:", booking.id);

    return new Response(JSON.stringify({ 
      success: true,
      booking,
      message: "Booking confirmed successfully"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error verifying booking payment:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
