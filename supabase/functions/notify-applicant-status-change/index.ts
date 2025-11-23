import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
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
    const { applicationType, applicationId, newStatus, adminNotes } = await req.json();

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const tableName = applicationType === 'agent' ? 'agent_applications' : 'brand_applications';
    const { data: application, error: appError } = await supabaseAdmin
      .from(tableName)
      .select("*")
      .eq("id", applicationId)
      .single();

    if (appError || !application) {
      return new Response(
        JSON.stringify({ error: "Application not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const recipientEmail = applicationType === 'agent' 
      ? application.email 
      : application.primary_contact_email;
    
    const recipientName = applicationType === 'agent'
      ? `${application.first_name} ${application.last_name}`
      : application.brand_name;

    let subject = "";
    let htmlContent = "";

    if (newStatus === 'approved') {
      subject = "🎉 Your Goldsainte Application Has Been Approved!";
      htmlContent = `
        <h2>Congratulations ${recipientName}!</h2>
        <p>Your ${applicationType} application has been approved.</p>
        <p>You can now access your dashboard and start using Goldsainte.</p>
        <p><a href="${APP_URL}/login">Login to Your Dashboard →</a></p>
        ${adminNotes ? `<p><em>Note from admin: ${adminNotes}</em></p>` : ''}
      `;
    } else if (newStatus === 'rejected') {
      subject = "Update on Your Goldsainte Application";
      htmlContent = `
        <h2>Application Status Update</h2>
        <p>Thank you for your interest in Goldsainte.</p>
        <p>After careful review, we're unable to approve your application at this time.</p>
        ${adminNotes ? `<p><strong>Reason:</strong> ${adminNotes}</p>` : ''}
        <p>If you have questions, please contact support@goldsainte.com</p>
      `;
    } else if (newStatus === 'additional_info_required') {
      subject = "Additional Information Needed for Your Application";
      htmlContent = `
        <h2>We Need More Information</h2>
        <p>We're reviewing your ${applicationType} application and need some additional information:</p>
        <p><strong>${adminNotes}</strong></p>
        <p><a href="${APP_URL}/application/update/${applicationId}">Provide Information →</a></p>
      `;
    }

    if (RESEND_API_KEY && subject && htmlContent) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Goldsainte Applications <applications@goldsainte.com>",
          to: recipientEmail,
          subject,
          html: htmlContent,
        }),
      });
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error in notify-applicant-status-change:", err);
    return new Response(
      JSON.stringify({ error: "Unexpected error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
