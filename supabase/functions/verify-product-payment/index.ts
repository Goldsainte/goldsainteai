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

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { paymentIntentId, orderId } = await req.json();

    // Get order
    const { data: order, error: orderError } = await supabaseClient
      .from('product_orders')
      .select('*')
      .eq('id', orderId)
      .eq('buyer_id', user.id)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: "2024-06-20",
    });

    // Verify payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Update order status
      const { error: updateError } = await supabaseClient
        .from('product_orders')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Update inventory if it's a product
      if (order.product_id) {
        const { data: product } = await supabaseClient
          .from('products')
          .select('inventory_count')
          .eq('id', order.product_id)
          .single();

        if (product && product.inventory_count !== null) {
          await supabaseClient
            .from('products')
            .update({ inventory_count: product.inventory_count - order.quantity })
            .eq('id', order.product_id);
        }
      }

      // Create earning record for seller
      await supabaseClient
        .from('creator_earnings')
        .insert({
          user_id: order.seller_id,
          post_id: null,
          earning_type: 'product_sale',
          amount: order.seller_payout,
          currency: order.currency,
          status: 'paid',
          stripe_transfer_id: paymentIntent.transfer_data?.destination || null,
        });

      console.log('Payment verified and order updated:', orderId);

      return new Response(
        JSON.stringify({
          success: true,
          status: 'paid',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          status: paymentIntent.status,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});