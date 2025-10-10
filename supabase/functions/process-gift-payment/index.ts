import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );

  try {
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { giftId, recipientId, postId, coinAmount } = await req.json();

    // Get gift details
    const { data: gift } = await supabaseClient
      .from('virtual_gifts')
      .select('*')
      .eq('id', giftId)
      .single();

    if (!gift) {
      throw new Error('Gift not found');
    }

    // Get recipient's Stripe account
    const { data: recipient } = await supabaseClient
      .from('profiles')
      .select('stripe_account_id, stripe_payouts_enabled')
      .eq('id', recipientId)
      .single();

    if (!recipient?.stripe_account_id || !recipient.stripe_payouts_enabled) {
      throw new Error('Recipient has not set up payouts');
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2025-08-27.basil',
    });

    // Calculate amounts (gift cost is in coins, convert to cents: 1 coin = $0.01)
    const totalAmountCents = gift.coin_cost; // coins = cents
    const creatorAmount = Math.floor(totalAmountCents * (gift.creator_payout_percentage / 100));
    const platformFee = totalAmountCents - creatorAmount;

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmountCents,
      currency: 'usd',
      application_fee_amount: platformFee,
      transfer_data: {
        destination: recipient.stripe_account_id,
      },
      metadata: {
        sender_id: user.id,
        recipient_id: recipientId,
        gift_id: giftId,
        post_id: postId || '',
      },
    });

    // Get current balance and deduct coins
    const { data: currentBalance } = await supabaseClient
      .from('user_coin_balance')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (!currentBalance || currentBalance.balance < gift.coin_cost) {
      throw new Error('Insufficient coins');
    }

    await supabaseClient
      .from('user_coin_balance')
      .update({ 
        balance: currentBalance.balance - gift.coin_cost,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    // Record transaction
    const { data: transaction } = await supabaseClient
      .from('gift_transactions')
      .insert({
        sender_id: user.id,
        recipient_id: recipientId,
        post_id: postId,
        gift_id: giftId,
        coin_amount: gift.coin_cost,
        creator_earnings: creatorAmount / 100, // convert to dollars
        platform_fee: platformFee / 100,
        stripe_payment_intent_id: paymentIntent.id,
        processed_at: new Date().toISOString()
      })
      .select()
      .single();

    // Record creator earning
    await supabaseClient
      .from('creator_earnings')
      .insert({
        user_id: recipientId,
        post_id: postId,
        earning_type: 'virtual_gift',
        amount: creatorAmount / 100,
        currency: 'USD',
        status: 'paid',
        platform_fee: platformFee / 100,
        transfer_date: new Date().toISOString()
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        paymentIntentId: paymentIntent.id,
        transactionId: transaction.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error processing gift payment:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
