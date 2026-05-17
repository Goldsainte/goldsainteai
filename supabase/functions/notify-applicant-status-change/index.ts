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
      ? `${application.first_name ?? ''} ${application.last_name ?? ''}`.trim()
      : application.brand_name;

    let templateName: string | null = null;
    let templateData: Record<string, unknown> = {};

    if (newStatus === 'approved') {
      templateName = 'application-approved-professional';
      templateData = {
        recipientName,
        applicationType,
        stripeOnboardingUrl: application.stripe_connect_onboarding_url ?? undefined,
        adminNotes: adminNotes ?? undefined,
      };
    } else if (newStatus === 'rejected') {
      templateName = 'application-declined-professional';
      templateData = { recipientName, adminNotes: adminNotes ?? undefined };
    } else if (newStatus === 'additional_info_required') {
      templateName = 'application-info-requested-professional';
      templateData = {
        recipientName,
        applicationId,
        adminNotes: adminNotes ?? undefined,
      };
    }

    if (templateName) {
      await supabaseAdmin.functions.invoke('send-transactional-email', {
        body: {
          templateName,
          recipientEmail,
          idempotencyKey: `application-${applicationType}-${applicationId}-${newStatus}`,
          templateData,
        },
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
