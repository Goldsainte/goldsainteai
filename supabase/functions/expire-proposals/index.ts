// supabase/functions/expire-proposals/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
};
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date().toISOString();

    // Expire any proposals that are past their valid_until date
    const { data, error } = await supabase
      .from("trip_proposals")
      .update({ status: "expired" })
      .lt("valid_until", now)
      .in("status", ["sent", "traveler_review"])
      .select("id");

    if (error) {
      console.error("Error expiring proposals:", error);
      throw error;
    }

    console.log(`Expired ${data?.length || 0} proposals`);

    return new Response(
      JSON.stringify({
        success: true,
        expired_count: data?.length || 0,
        expired_ids: data?.map((p) => p.id) || [],
      }),
      {
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      }
    );
  }
});
