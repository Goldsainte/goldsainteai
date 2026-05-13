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
        { status: 404, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
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
      
      // Get Stripe onboarding URL if available (for agents)
      let stripeSection = '';
      if (applicationType === 'agent' && application.stripe_connect_onboarding_url) {
        stripeSection = `
          <div style="margin: 24px 0; padding: 20px; background: #f7f3ea; border-left: 4px solid #0c4d47; border-radius: 8px;">
            <h3 style="margin: 0 0 12px 0; color: #0a2225; font-size: 18px;">Step 2: Connect Your Bank Account</h3>
            <p style="margin: 0 0 12px 0; color: #4a4a4a; font-size: 14px;">
              Required to receive commission payments (takes 2-3 minutes):
            </p>
            <a href="${application.stripe_connect_onboarding_url}" 
               style="display: inline-block; padding: 12px 24px; background: #635BFF; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
              Complete Stripe Connect Setup →
            </a>
            <p style="margin: 16px 0 0 0; color: #8D8D8D; font-size: 12px;">
              <strong>Why Stripe?</strong> We use Stripe Connect for secure, PCI-compliant commission payments. 
              Your banking details are encrypted by Stripe and never stored by Goldsainte.
            </p>
          </div>
        `;
      }
      
      htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0a2225; font-size: 24px; margin-bottom: 16px;">Congratulations ${recipientName}! 🎉</h2>
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
            Your ${applicationType} application has been approved. Welcome to the Goldsainte network!
          </p>
          
          <div style="margin: 24px 0; padding: 20px; background: #ffffff; border: 1px solid #E5DFC6; border-radius: 8px;">
            <h3 style="margin: 0 0 12px 0; color: #0a2225; font-size: 18px;">Step 1: Access Your Dashboard</h3>
            <p style="margin: 0 0 12px 0; color: #4a4a4a; font-size: 14px;">
              Log in to your Goldsainte dashboard:
            </p>
            <a href="${APP_URL}/login" 
               style="display: inline-block; padding: 12px 24px; background: #0c4d47; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
              Login to Dashboard →
            </a>
            <p style="margin: 12px 0 0 0; color: #8D8D8D; font-size: 12px;">
              You'll be prompted to set your permanent password on first login.
            </p>
          </div>
          
          ${stripeSection}
          
          ${adminNotes ? `
            <div style="margin: 24px 0; padding: 16px; background: #f0f9ff; border-radius: 8px;">
              <p style="margin: 0; color: #0369a1; font-size: 14px;">
                <strong>Note from admin:</strong> ${adminNotes}
              </p>
            </div>
          ` : ''}
          
          <p style="margin: 24px 0 0 0; color: #8D8D8D; font-size: 13px;">
            Once you've completed both steps, you're ready to start receiving trip requests and earning commissions!
          </p>
        </div>
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
      { headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error in notify-applicant-status-change:", err);
    return new Response(
      JSON.stringify({ error: "Unexpected error" }),
      { status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
