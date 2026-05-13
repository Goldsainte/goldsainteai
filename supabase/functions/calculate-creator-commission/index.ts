import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
};
}

interface CommissionRequest {
  creatorId: string;
  transactionType: "booking" | "shop" | "gift" | "affiliate" | "partnership";
  sourceId: string;
  amount: number;
  metadata?: Record<string, any>;
}

interface TierConfig {
  tier: "bronze" | "gold" | "platinum";
  multiplier: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { creatorId, transactionType, sourceId, amount, metadata }: CommissionRequest = await req.json();

    console.log(`📊 [COMMISSION] Calculating for creator ${creatorId}, type: ${transactionType}, amount: ${amount}`);

    // Get creator tier
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("creator_tier")
      .eq("id", creatorId)
      .single();

    if (profileError) throw profileError;

    const tier = profile?.creator_tier || "bronze";

    // Get tier multiplier
    const tierConfig: Record<string, number> = {
      bronze: 1.0,
      gold: 1.1,
      platinum: 1.2,
    };

    const tierMultiplier = tierConfig[tier] || 1.0;

    // Base commission rates by transaction type
    const baseRates: Record<string, number> = {
      booking: 0.4, // 40%
      shop: 0.3, // 30%
      gift: 0.7, // 70%
      affiliate: 0.15, // 15% (variable by partner)
      partnership: 0.2, // 20% (negotiated)
    };

    const baseRate = baseRates[transactionType] || 0.1;

    // Calculate commission
    const baseCommission = amount * baseRate;
    const commissionWithTier = baseCommission * tierMultiplier;

    // Platform host fee (3.5% of booking subtotal)
    const platformFee = amount * 0.035;
    const netPayout = commissionWithTier - platformFee;

    // Hold period: 14 days from now for bookings, immediate for others
    const holdDays = transactionType === "booking" ? 14 : 0;
    const holdUntil = new Date();
    holdUntil.setDate(holdUntil.getDate() + holdDays);

    console.log(`💰 [COMMISSION] Base: ${baseCommission}, With tier (${tier} ${tierMultiplier}x): ${commissionWithTier}, Net: ${netPayout}`);

    // Create revenue transaction
    const { data: transaction, error: txError } = await supabase
      .from("creator_revenue_transactions")
      .insert({
        creator_id: creatorId,
        transaction_type: transactionType,
        source_id: sourceId,
        amount: amount,
        commission_rate: baseRate,
        tier_multiplier: tierMultiplier,
        platform_fee: platformFee,
        net_payout: netPayout,
        status: holdDays > 0 ? "held" : "released",
        hold_until: holdDays > 0 ? holdUntil.toISOString() : null,
        released_at: holdDays === 0 ? new Date().toISOString() : null,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (txError) throw txError;

    // Update creator balance
    const { error: balanceError } = await supabase.rpc("update_creator_balance", {
      p_creator_id: creatorId,
      p_amount: netPayout,
      p_pending: holdDays > 0,
    });

    if (balanceError) {
      console.error("⚠️ [COMMISSION] Balance update failed:", balanceError);
      // Continue even if balance update fails - we'll have the transaction record
    }

    console.log(`✅ [COMMISSION] Transaction created: ${transaction.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        transaction: {
          id: transaction.id,
          netPayout,
          platformFee,
          tierMultiplier,
          holdUntil: holdDays > 0 ? holdUntil.toISOString() : null,
        },
      }),
      {
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [COMMISSION ERROR]:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      }
    );
  }
});
