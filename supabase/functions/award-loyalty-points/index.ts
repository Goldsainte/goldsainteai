import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "https://goldsainte.ai",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AwardPointsRequest {
  userId: string;
  points: number;
  reason: string;
  entityType?: string;
  entityId?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { userId, points, reason, entityType, entityId } = await req.json() as AwardPointsRequest;

    if (!userId || !points || !reason) {
      throw new Error("Missing required fields");
    }

    // Use the database function to award points
    const { data, error } = await supabaseClient.rpc("award_loyalty_points", {
      target_user_id: userId,
      points: points,
      transaction_reason: reason,
      entity_type: entityType || null,
      entity_id: entityId || null,
    });

    if (error) throw error;

    // Get updated loyalty info
    const { data: loyaltyData } = await supabaseClient
      .from("loyalty_points")
      .select("*")
      .eq("user_id", userId)
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        points_awarded: points,
        new_balance: loyaltyData?.points_balance || 0,
        tier: loyaltyData?.tier || "bronze",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
