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

    // Validate input and disallow self-gifts with a clear message
    if (!giftId || !recipientId || !postId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (recipientId === user.id) {
      return new Response(
        JSON.stringify({ error: 'You cannot send a gift to yourself.' }),
        { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get gift details
    const { data: gift } = await supabaseClient
      .from('virtual_gifts')
      .select('*')
      .eq('id', giftId)
      .single();

    if (!gift) {
      throw new Error('Gift not found');
    }

    // Calculate amounts
    const creatorAmount = Math.floor(gift.coin_cost * (gift.creator_payout_percentage / 100));
    const platformFee = gift.coin_cost - creatorAmount;

    // Get current balance and deduct coins
    const { data: currentBalance } = await supabaseClient
      .from('user_coin_balance')
      .select('balance')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!currentBalance || currentBalance.balance < gift.coin_cost) {
      throw new Error('Insufficient coins');
    }

    // Deduct coins from sender
    await supabaseClient
      .from('user_coin_balance')
      .update({ 
        balance: currentBalance.balance - gift.coin_cost,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    // Add coins to recipient (they can cash out later via Stripe)
    const { data: recipientBalance } = await supabaseClient
      .from('user_coin_balance')
      .select('balance')
      .eq('user_id', recipientId)
      .maybeSingle();

    if (recipientBalance) {
      await supabaseClient
        .from('user_coin_balance')
        .update({ 
          balance: recipientBalance.balance + creatorAmount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', recipientId);
    } else {
      await supabaseClient
        .from('user_coin_balance')
        .insert({ 
          user_id: recipientId,
          balance: creatorAmount
        });
    }

    // Record transaction
    const { data: transaction } = await supabaseClient
      .from('gift_transactions')
      .insert({
        sender_id: user.id,
        recipient_id: recipientId,
        post_id: postId,
        gift_id: giftId,
        coin_amount: gift.coin_cost,
        creator_earnings: creatorAmount / 100, // convert to dollars for display
        platform_fee: platformFee / 100,
        processed_at: new Date().toISOString()
      })
      .select()
      .single();

    // Record creator earning as pending (will be paid when they cash out)
    await supabaseClient
      .from('creator_earnings')
      .insert({
        user_id: recipientId,
        post_id: postId,
        earning_type: 'virtual_gift',
        amount: creatorAmount / 100,
        currency: 'USD',
        status: 'pending',
        platform_fee: platformFee / 100
      });

    return new Response(
      JSON.stringify({ 
        success: true,
        transactionId: transaction.id,
        coins_spent: gift.coin_cost,
        creator_received: creatorAmount
      }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error processing gift payment:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
