import "../_shared/resend-guard.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
};
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const APP_URL = Deno.env.get("APP_URL") || "https://goldsainte.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const { applicationType, applicationId, applicantName, applicantEmail } = await req.json();

    if (!applicationType || !applicationId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get admin emails
    const { data: admins, error: adminError } = await supabaseAdmin
      .from("admin_users")
      .select("user_id, profiles!inner(email, full_name)")
      .eq(applicationType === 'agent' ? 'can_approve_agents' : 'can_approve_brands', true);

    if (adminError) {
      console.error("Error loading admins:", adminError);
      return new Response(
        JSON.stringify({ error: "Could not load admins" }),
        { status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const adminEmails = admins?.map((a: any) => a.profiles?.email).filter(Boolean) || [];

    if (adminEmails.length === 0) {
      console.log("No admin emails found to notify");
      return new Response(
        JSON.stringify({ success: true, message: "No admins to notify" }),
        { headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Send email notification if RESEND configured
    if (RESEND_API_KEY) {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Goldsainte Applications <hello@goldsainte.com>",
          to: adminEmails,
          subject: `New ${applicationType === 'agent' ? 'Agent' : 'Brand'} Application`,
          html: `
            <h2>New ${applicationType === 'agent' ? 'Agent' : 'Brand'} Application Submitted</h2>
            <p><strong>Applicant:</strong> ${applicantName}</p>
            <p><strong>Email:</strong> ${applicantEmail}</p>
            <p><strong>Application ID:</strong> ${applicationId}</p>
            <p><a href="${APP_URL}/admin/applications">Review Application →</a></p>
          `,
        }),
      });

      if (!emailResponse.ok) {
        console.error("Resend API error:", await emailResponse.text());
      }
    } else {
      console.log("RESEND_API_KEY not configured - would send email to:", adminEmails);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error in notify-admin-new-application:", err);
    return new Response(
      JSON.stringify({ error: "Unexpected error" }),
      { status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
