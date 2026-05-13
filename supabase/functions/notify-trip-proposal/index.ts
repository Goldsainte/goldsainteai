import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { generateProposalReceivedEmail } from "./_templates/proposal-received-email.ts";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Vary": "Origin",
};
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
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

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    // Fetch trip request to get user_id and traveler profile
    const { data: tripRequest, error: tripError } = await supabaseClient
      .from("trip_requests")
      .select("user_id, title, destination")
      .eq("id", tripRequestId)
      .single();

    if (tripError || !tripRequest) {
      console.error("[NOTIFY_TRIP_PROPOSAL] Trip request not found:", tripError);
      throw new Error("Trip request not found");
    }

    // Get traveler profile
    const { data: travelerProfile } = await supabaseClient
      .from("profiles")
      .select("first_name, email")
      .eq("id", tripRequest.user_id)
      .single();

    // Get the latest proposal for this trip with proposer info
    const { data: proposal, error: proposalError } = await supabaseClient
      .from("trip_proposals")
      .select("proposer_role, headline, price_from, proposer_id")
      .eq("trip_request_id", tripRequestId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (proposalError || !proposal) {
      console.error("[NOTIFY_TRIP_PROPOSAL] Proposal not found:", proposalError);
      throw new Error("Proposal not found");
    }

    // Get proposer profile info
    const { data: proposerProfile } = await supabaseClient
      .from("profiles")
      .select("first_name, username")
      .eq("id", proposal.proposer_id)
      .single();

    const proposerName = proposerProfile?.first_name || proposerProfile?.username || "A creator";
    const roleLabel = proposal.proposer_role === "creator" ? "TikTok Creator" : "Travel Agent";
    const priceText = proposal.price_from ? ` starting from $${proposal.price_from} per person` : "";
    const travelerFirstName = travelerProfile?.first_name || "there";
    const travelerEmail = travelerProfile?.email;

    // Send email notification via Resend
    if (travelerEmail) {
      try {
        const emailHtml = generateProposalReceivedEmail({
          firstName: travelerFirstName,
          tripTitle: tripRequest.title || `Trip to ${tripRequest.destination}`,
          destination: tripRequest.destination || "your destination",
          proposerName,
          proposerRole: roleLabel,
          priceFrom: proposal.price_from,
          headline: proposal.headline,
          tripRequestId,
        });

        const { error: emailError } = await resend.emails.send({
          from: "Goldsainte <notification@goldsainte.ai>",
          to: [travelerEmail],
          subject: "Your Goldsainte trip just received a new proposal",
          html: emailHtml,
        });

        if (emailError) {
          console.error("[NOTIFY_TRIP_PROPOSAL] Email error:", emailError);
        } else {
          console.log("[NOTIFY_TRIP_PROPOSAL] Email sent successfully to:", travelerEmail);
        }
      } catch (emailError) {
        console.error("[NOTIFY_TRIP_PROPOSAL] Email send failed:", emailError);
      }
    }

    // Send in-app notification via existing send-notification function
    const { data: notificationResult, error: notificationError } = await supabaseClient.functions.invoke("send-notification", {
      body: {
        userId: tripRequest.user_id,
        title: "Your Goldsainte trip just received a new proposal",
        body: `${proposerName} (${roleLabel}) sent a proposal for "${tripRequest.title || tripRequest.destination}"${priceText}. ${proposal.headline ? `"${proposal.headline}"` : "View the full pitch in your Trip Requests."}`,
        type: "milestone",
        priority: "high",
        actionUrl: `/trip-request/${tripRequestId}`,
        data: {
          tripRequestId,
          proposalHeadline: proposal.headline,
          proposerRole: proposal.proposer_role,
          proposerName,
          priceFrom: proposal.price_from,
        },
      },
    });

    if (notificationError) {
      console.error("[NOTIFY_TRIP_PROPOSAL] Notification error:", notificationError);
    }

    console.log("[NOTIFY_TRIP_PROPOSAL] Notification sent successfully:", notificationResult);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[NOTIFY_TRIP_PROPOSAL] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders(req), "Content-Type": "application/json" }, status: 400 }
    );
  }
});
