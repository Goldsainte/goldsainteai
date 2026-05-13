import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "https://goldsainte.ai",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const APP_URL = Deno.env.get("APP_URL") || "https://goldsainte.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, applicationType, applicationId, sessionId } = await req.json();

    if (!email || !applicationType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get applicant details
    const tableName = applicationType === 'agent' ? 'agent_applications' : 'brand_applications';
    const { data: application } = await supabaseAdmin
      .from(tableName)
      .select("*")
      .eq("id", applicationId || "")
      .maybeSingle();

    const applicantName = applicationType === 'agent' && application
      ? `${application.first_name} ${application.last_name}`
      : application?.brand_name || "Unknown";

    const applicantEmail = applicationType === 'agent' && application
      ? application.email
      : application?.primary_contact_email || "unknown@example.com";

    // Get admin emails
    const { data: admins } = await supabaseAdmin
      .from("admin_users")
      .select("user_id, profiles!inner(email, full_name)")
      .eq(applicationType === 'agent' ? 'can_approve_agents' : 'can_approve_brands', true);

    const adminEmails = admins?.map((a: any) => a.profiles?.email).filter(Boolean) || [];

    if (adminEmails.length === 0) {
      console.log("No admin emails found to notify");
      return new Response(
        JSON.stringify({ success: true, message: "No admins to notify" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send email notification
    if (RESEND_API_KEY) {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Goldsainte Applications <applications@goldsainte.com>",
          to: adminEmails,
          subject: `✅ ${applicationType === 'agent' ? 'Agent' : 'Brand'} Verification Complete - Ready for Review`,
          html: `
            <h2>Identity Verification Complete</h2>
            <p>A ${applicationType} applicant has successfully completed Stripe Identity verification and is ready for admin review.</p>
            <p><strong>Applicant:</strong> ${applicantName}</p>
            <p><strong>Email:</strong> ${applicantEmail}</p>
            <p><strong>Verification Session:</strong> ${sessionId}</p>
            ${applicationId ? `<p><strong>Application ID:</strong> ${applicationId}</p>` : ''}
            <p><a href="${APP_URL}/admin/applications">Review Application Now →</a></p>
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
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error in notify-admin-verification-complete:", err);
    return new Response(
      JSON.stringify({ error: "Unexpected error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
