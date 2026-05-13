import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  "Vary": "Origin",
};
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
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

    if (!user?.email) {
      throw new Error('User not authenticated');
    }

    const { productId, packageId, quantity, shippingAddress } = await req.json();

    // Get product or package details
    let itemDetails: any;
    let sellerId: string;
    let price: number;
    let currency: string;

    if (productId) {
      const { data: product, error } = await supabaseClient
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error || !product) throw new Error('Product not found');
      if (!product.is_active) throw new Error('Product is not available');

      itemDetails = product;
      sellerId = product.creator_id;
      price = product.price;
      currency = product.currency;
    } else if (packageId) {
      const { data: pkg, error } = await supabaseClient
        .from('travel_packages')
        .select('*')
        .eq('id', packageId)
        .single();

      if (error || !pkg) throw new Error('Package not found');
      if (!pkg.is_active) throw new Error('Package is not available');

      itemDetails = pkg;
      sellerId = pkg.creator_id;
      price = pkg.price;
      currency = pkg.currency;
    } else {
      throw new Error('Either productId or packageId is required');
    }

    // Calculate amounts (70% to creator, 30% platform fee)
    const totalAmount = price * quantity;
    const platformFee = totalAmount * 0.30;
    const sellerPayout = totalAmount - platformFee;

    // Get seller's Stripe account
    const { data: sellerProfile } = await supabaseClient
      .from('profiles')
      .select('stripe_account_id, stripe_payouts_enabled')
      .eq('id', sellerId)
      .single();

    if (!sellerProfile?.stripe_account_id || !sellerProfile.stripe_payouts_enabled) {
      throw new Error('Seller has not set up payouts yet');
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: "2024-06-20",
    });

    // Create payment intent with transfer to seller
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100),
      currency: currency.toLowerCase(),
      application_fee_amount: Math.round(platformFee * 100),
      transfer_data: {
        destination: sellerProfile.stripe_account_id,
      },
      metadata: {
        product_id: productId || '',
        package_id: packageId || '',
        seller_id: sellerId,
        buyer_id: user.id,
      },
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
    });

    // Create order record
    const { data: order, error: orderError } = await supabaseClient
      .from('product_orders')
      .insert({
        buyer_id: user.id,
        seller_id: sellerId,
        product_id: productId || null,
        package_id: packageId || null,
        quantity,
        total_amount: totalAmount,
        currency,
        seller_payout: sellerPayout,
        platform_fee: platformFee,
        status: 'pending',
        stripe_payment_intent_id: paymentIntent.id,
        shipping_address: shippingAddress || null,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    console.log('Order created:', order.id);

    return new Response(
      JSON.stringify({
        success: true,
        clientSecret: paymentIntent.client_secret,
        orderId: order.id,
      }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error processing purchase:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});