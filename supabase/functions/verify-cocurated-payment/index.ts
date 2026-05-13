import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://goldsainte.ai',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: "2024-06-20",
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return new Response(
        JSON.stringify({ success: false, message: 'Payment not completed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const metadata = session.metadata || {};
    const packageId = metadata.package_id;
    const promoCode = metadata.promo_code;
    const promotionId = metadata.promotion_id;
    const travelers = parseInt(metadata.travelers || '1');

    // Create booking record
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .insert({
        booking_type: 'cocurated_package',
        total_price: session.amount_total! / 100,
        currency: session.currency?.toUpperCase() || 'USD',
        payment_status: 'completed',
        status: 'confirmed',
        stripe_payment_intent_id: session.payment_intent as string,
        booking_data: {
          package_id: packageId,
          travelers,
          promo_code: promoCode
        }
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    // Track conversion if promo code was used
    if (promoCode && promotionId) {
      await supabaseClient
        .from('promo_code_usage')
        .update({ converted: true })
        .eq('promo_code', promoCode)
        .eq('package_id', packageId)
        .order('clicked_at', { ascending: false })
        .limit(1);

      // Update promotion stats - increment conversions
      const { data: currentPromo } = await supabaseClient
        .from('influencer_promotions')
        .select('conversions')
        .eq('id', promotionId)
        .single();

      if (currentPromo) {
        await supabaseClient
          .from('influencer_promotions')
          .update({ conversions: (currentPromo.conversions || 0) + 1 })
          .eq('id', promotionId);
      }

      // Create commission record for influencer (agent already paid via Stripe Connect)
      if (parseFloat(metadata.influencer_commission || '0') > 0) {
        await supabaseClient
          .from('shared_commission_bookings')
          .insert({
            package_id: packageId,
            promotion_id: promotionId,
            booking_id: booking.id,
            customer_id: booking.user_id,
            total_booking_amount: session.amount_total! / 100,
            currency: session.currency?.toUpperCase() || 'USD',
            agent_commission: parseFloat(metadata.agent_commission || '0'),
            influencer_commission: parseFloat(metadata.influencer_commission || '0'),
            platform_fee: parseFloat(metadata.platform_fee || '0'),
            agent_paid_via_connect: true
          });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        bookingId: booking.id,
        message: 'Booking confirmed successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});