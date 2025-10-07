import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const checkoutSchema = z.object({
  bookingId: z.string().uuid(),
  amount: z.number().positive().max(1000000),
  currency: z.string().length(3).default('USD'),
  guestEmail: z.string().email().max(255),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: Authenticate user first
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(JSON.stringify({ 
        error: 'Authentication required'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(JSON.stringify({ 
        error: 'Invalid authentication'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const body = await req.json();
    
    // Validate input
    const validationResult = checkoutSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error);
      return new Response(JSON.stringify({ 
        error: 'Invalid request data'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    
    const { bookingId, amount, currency, guestEmail } = validationResult.data;

    console.log('Creating checkout session for booking:', bookingId);

    // SECURITY: Verify booking exists and belongs to authenticated user
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('id, total_price, currency, user_id, booking_type')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('Booking not found:', bookingError);
      return new Response(JSON.stringify({ 
        error: 'Booking not found'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // SECURITY: Verify ownership
    if (booking.user_id !== user.id) {
      console.error('Unauthorized access attempt for booking:', bookingId);
      return new Response(JSON.stringify({ 
        error: 'Unauthorized'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // SECURITY: Verify amount matches booking total
    if (Math.abs(booking.total_price - amount) > 0.01) {
      console.error('Price mismatch - Expected:', booking.total_price, 'Got:', amount);
      return new Response(JSON.stringify({ 
        error: 'Invalid payment amount'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "");

    // Create payment record
    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .insert({
        booking_id: bookingId,
        amount: amount,
        currency: currency,
        status: 'pending'
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Payment record creation error:', paymentError);
      throw new Error('Failed to create payment record');
    }

    // Create Stripe checkout session with custom branding
    const session = await stripe.checkout.sessions.create({
      customer_email: guestEmail,
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: 'Luxury Travel Booking',
              description: `Premium ${booking.booking_type} reservation`
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/booking-confirmation?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
      cancel_url: `${req.headers.get("origin")}/booking-cancelled`,
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      custom_text: {
        submit: {
          message: 'Complete your luxury travel booking'
        }
      },
      metadata: {
        booking_id: bookingId,
        payment_id: payment.id
      }
    });

    // Update payment record with session ID
    await supabaseClient
      .from('payments')
      .update({
        stripe_session_id: session.id,
        status: 'processing'
      })
      .eq('id', payment.id);

    console.log('Checkout session created:', session.id);

    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error('Error in create-checkout:', error);
    // SECURITY: Return generic error message, log details server-side only
    return new Response(JSON.stringify({ error: 'Payment processing failed. Please try again.' }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});