import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tripRequestId } = await req.json();
    
    if (!tripRequestId) {
      throw new Error("tripRequestId is required");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch trip request to get user_id
    const { data: tripRequest, error: tripError } = await supabaseClient
      .from("trip_requests")
      .select("user_id, title, destination")
      .eq("id", tripRequestId)
      .single();

    if (tripError || !tripRequest) {
      console.error("[NOTIFY_TRIP_PROPOSAL] Trip request not found:", tripError);
      throw new Error("Trip request not found");
    }

    // Get the latest proposal for this trip
    const { data: proposal, error: proposalError } = await supabaseClient
      .from("trip_proposals")
      .select("proposer_role, headline")
      .eq("trip_request_id", tripRequestId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (proposalError || !proposal) {
      console.error("[NOTIFY_TRIP_PROPOSAL] Proposal not found:", proposalError);
      throw new Error("Proposal not found");
    }

    // Send notification via existing send-notification function
    const { data: notificationResult, error: notificationError } = await supabaseClient.functions.invoke("send-notification", {
      body: {
        userId: tripRequest.user_id,
        title: "New Trip Proposal Received! 🎉",
        body: `A ${proposal.proposer_role} sent a proposal for your trip to ${tripRequest.destination || "your destination"}`,
        type: "milestone",
        priority: "high",
        actionUrl: `/trip-request/${tripRequestId}`,
        data: {
          tripRequestId,
          proposalHeadline: proposal.headline,
          proposerRole: proposal.proposer_role,
        },
      },
    });

    if (notificationError) {
      console.error("[NOTIFY_TRIP_PROPOSAL] Notification error:", notificationError);
    }

    console.log("[NOTIFY_TRIP_PROPOSAL] Notification sent successfully:", notificationResult);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[NOTIFY_TRIP_PROPOSAL] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
