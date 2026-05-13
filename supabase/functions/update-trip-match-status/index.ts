import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
}

interface UpdateStatusPayload {
  matchId: string;
  status: "accepted" | "declined";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const { matchId, status }: UpdateStatusPayload = await req.json();

    if (!matchId || !status) {
      return new Response(JSON.stringify({ error: "Missing matchId or status" }), {
        status: 400,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    if (!["accepted", "declined"].includes(status)) {
      return new Response(JSON.stringify({ error: "Invalid status. Must be 'accepted' or 'declined'" }), {
        status: 400,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Verify the match belongs to the authenticated user
    const { data: match, error: fetchError } = await supabase
      .from("trip_request_matches")
      .select("id, candidate_profile_id, trip_request_id, status")
      .eq("id", matchId)
      .single();

    if (fetchError || !match) {
      return new Response(JSON.stringify({ error: "Match not found" }), {
        status: 404,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    if (match.candidate_profile_id !== user.id) {
      return new Response(JSON.stringify({ error: "Not authorized to update this match" }), {
        status: 403,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Update the match status
    const { error: updateError } = await supabase
      .from("trip_request_matches")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", matchId);

    if (updateError) {
      console.error("[update-trip-match-status] Update error:", updateError);
      return new Response(JSON.stringify({ error: "Failed to update match status" }), {
        status: 500,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // If accepted, optionally update trip_request_assignments
    if (status === "accepted") {
      const { error: assignError } = await supabase
        .from("trip_request_assignments")
        .upsert({
          trip_request_id: match.trip_request_id,
          assignee_profile_id: user.id,
          assignee_role: "creator", // or determine from profile
          assigned_by: "system",
        }, {
          onConflict: "trip_request_id",
        });

      if (assignError) {
        console.error("[update-trip-match-status] Assignment error:", assignError);
        // Continue anyway - match status was updated successfully
      }
    }

    return new Response(JSON.stringify({ success: true, status }), {
      status: 200,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[update-trip-match-status] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
