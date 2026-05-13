import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
};
}

interface NotificationRequest {
  userId: string;
  jobId: string;
  notificationType: "new_bid" | "job_assigned" | "job_completed" | "payment_received" | "message_received";
  customData?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { userId, jobId, notificationType, customData } = await req.json() as NotificationRequest;

    // Get user profile and notification preferences
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("username, email")
      .eq("id", userId)
      .single();

    const { data: prefs } = await supabaseClient
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    // Get job details
    const { data: job } = await supabaseClient
      .from("marketplace_jobs")
      .select("title, booking_type")
      .eq("id", jobId)
      .single();

    if (!profile || !job) {
      throw new Error("User or job not found");
    }

    // Check if user wants email notifications for this type
    const shouldSendEmail = prefs?.email_job_updates !== false;

    if (!shouldSendEmail || !RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ success: true, message: "Notification preferences disabled or API key missing" }),
        { headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Prepare email content based on notification type
    let subject = "";
    let htmlContent = "";

    switch (notificationType) {
      case "new_bid":
        subject = `New bid on your job: ${job.title}`;
        htmlContent = `
          <h2>You have a new bid!</h2>
          <p>A travel agent has submitted a bid for your job: <strong>${job.title}</strong></p>
          <p>Log in to review the bid and agent profile.</p>
        `;
        break;
      case "job_assigned":
        subject = `Job assigned: ${job.title}`;
        htmlContent = `
          <h2>Congratulations!</h2>
          <p>You've been assigned to the job: <strong>${job.title}</strong></p>
          <p>Please review the details and begin working on this exciting project!</p>
        `;
        break;
      case "job_completed":
        subject = `Job completed: ${job.title}`;
        htmlContent = `
          <h2>Job Completed</h2>
          <p>The agent has marked your job as complete: <strong>${job.title}</strong></p>
          <p>Please review the deliverables and approve if satisfied.</p>
        `;
        break;
      case "payment_received":
        subject = `Payment received for: ${job.title}`;
        htmlContent = `
          <h2>Payment Received</h2>
          <p>Your payment for <strong>${job.title}</strong> has been processed successfully.</p>
          <p>Amount: $${customData?.amount || "0.00"}</p>
        `;
        break;
      case "message_received":
        subject = `New message about: ${job.title}`;
        htmlContent = `
          <h2>New Message</h2>
          <p>You have a new message regarding: <strong>${job.title}</strong></p>
          <p>Log in to view and respond to the message.</p>
        `;
        break;
    }

    // Send email via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Marketplace <notifications@yourdomain.com>",
        to: [profile.email],
        subject,
        html: htmlContent,
      }),
    });

    if (!res.ok) {
      throw new Error(`Failed to send email: ${await res.text()}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders(req), "Content-Type": "application/json" }, status: 400 }
    );
  }
});
