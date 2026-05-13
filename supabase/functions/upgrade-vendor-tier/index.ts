import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://goldsainte.ai',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TIER_PRICING = {
  free: { monthlyPrice: 0, commissionRate: 15.0 },
  bronze: { monthlyPrice: 99, commissionRate: 15.0 },
  silver: { monthlyPrice: 299, commissionRate: 13.5 },
  gold: { monthlyPrice: 599, commissionRate: 12.75 },
  platinum: { monthlyPrice: 1499, commissionRate: 12.0 },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { vendorId, newTier, paymentMethodId } = await req.json();

    if (!vendorId || !newTier) {
      throw new Error('Missing required fields: vendorId, newTier');
    }

    const tierConfig = TIER_PRICING[newTier as keyof typeof TIER_PRICING];
    if (!tierConfig) {
      throw new Error('Invalid tier');
    }

    // Get existing subscription
    const { data: existingSub } = await supabaseAdmin
      .from('vendor_promotion_subscriptions')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('status', 'active')
      .single();

    if (existingSub) {
      // Update existing subscription
      await supabaseAdmin
        .from('vendor_promotion_subscriptions')
        .update({
          tier: newTier,
          monthly_price: tierConfig.monthlyPrice,
          commission_rate: tierConfig.commissionRate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSub.id);
    } else {
      // Create new subscription
      await supabaseAdmin
        .from('vendor_promotion_subscriptions')
        .insert({
          vendor_id: vendorId,
          tier: newTier,
          monthly_price: tierConfig.monthlyPrice,
          commission_rate: tierConfig.commissionRate,
          status: newTier === 'free' ? 'active' : 'pending_payment',
          payment_method_id: paymentMethodId,
        });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      tier: newTier,
      monthlyPrice: tierConfig.monthlyPrice,
      commissionRate: tierConfig.commissionRate
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
