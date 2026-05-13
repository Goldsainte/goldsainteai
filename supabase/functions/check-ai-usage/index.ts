import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getAIUsageStats, AI_TIERS } from "../_shared/aiUsageTracker.ts";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
};
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    const stats = await getAIUsageStats(
      user.id,
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Include tier information
    const tierInfo = AI_TIERS[stats.tier];

    return new Response(
      JSON.stringify({
        ...stats,
        tierInfo: {
          name: tierInfo.name,
          price: tierInfo.price,
          priceId: tierInfo.priceId
        },
        availableTiers: Object.entries(AI_TIERS).map(([key, value]) => ({
          key,
          name: value.name,
          limit: value.limit,
          price: value.price,
          priceId: value.priceId
        }))
      }),
      {
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error checking AI usage:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
