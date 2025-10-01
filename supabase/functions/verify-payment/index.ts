import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const paymentVerificationSchema = z.object({
  sessionId: z.string().min(1).max(500),
  bookingId: z.string().uuid(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate input
    const validationResult = paymentVerificationSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error);
      return new Response(JSON.stringify({ 
        error: 'Invalid input data',
        details: validationResult.error.issues 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    
    const { sessionId, bookingId } = validationResult.data;

    console.log('Verifying payment:', { sessionId, bookingId });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    console.log('Session status:', session.payment_status);

    // Update payment status
    const { error: paymentError } = await supabaseClient
      .from('payments')
      .update({
        status: session.payment_status === 'paid' ? 'succeeded' : 'failed',
        stripe_payment_intent_id: session.payment_intent as string,
        payment_method: session.payment_method_types?.[0]
      })
      .eq('stripe_session_id', sessionId);

    if (paymentError) {
      console.error('Payment update error:', paymentError);
    }

    // Update booking status
    if (session.payment_status === 'paid') {
      const { error: bookingError } = await supabaseClient
        .from('bookings')
        .update({
          status: 'confirmed'
        })
        .eq('id', bookingId);

      if (bookingError) {
        console.error('Booking update error:', bookingError);
      }
    }

    // Get updated booking
    const { data: booking } = await supabaseClient
      .from('bookings')
      .select('*, guests(*)')
      .eq('id', bookingId)
      .single();

    return new Response(JSON.stringify({ 
      paymentStatus: session.payment_status,
      booking
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error('Error in verify-payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
