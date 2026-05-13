import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "https://goldsainte.ai",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-VERIFICATION-EMAIL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");
    
    const { user_id, status, rejection_reason } = await req.json();
    logStep("Request body parsed", { user_id, status });

    if (!user_id || !status) {
      throw new Error("Missing required fields: user_id, status");
    }

    if (!RESEND_API_KEY) {
      logStep("RESEND_API_KEY not configured, skipping email");
      return new Response(JSON.stringify({ success: true, skipped: true, reason: "RESEND_API_KEY not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      });
    }

    // Initialize Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get user email from Supabase Auth
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(user_id);
    
    if (userError) throw new Error(`Failed to get user: ${userError.message}`);
    if (!user?.email) throw new Error("User email not found");
    
    logStep("User email retrieved", { email: user.email });

    const subject = status === 'approved' 
      ? "✓ Your Verification is Approved!"
      : "Verification Update";
      
    const html = status === 'approved'
      ? `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">Congratulations! 🎉</h1>
          <p style="font-size: 16px; line-height: 1.6;">
            Your identity verification has been approved. You now have a verified customer badge on your profile!
          </p>
          <p style="font-size: 16px; line-height: 1.6;">
            The verified badge helps build trust with travel agents and other users on the platform.
          </p>
          <a href="${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app') || ''}/travel-profile" 
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            View Your Profile
          </a>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Thank you for being a verified member of our community!
          </p>
        </div>
      `
      : `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #dc2626;">Verification Update</h1>
          <p style="font-size: 16px; line-height: 1.6;">
            We were unable to approve your verification request.
          </p>
          <p style="font-size: 16px; line-height: 1.6;">
            <strong>Reason:</strong> ${rejection_reason || 'Please contact support for details.'}
          </p>
          <p style="font-size: 16px; line-height: 1.6;">
            You can submit a new verification request from your settings page.
          </p>
          <a href="${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app') || ''}/travel-settings" 
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Go to Settings
          </a>
        </div>
      `;

    // Send email using Resend API
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Goldsainte Travel <onboarding@resend.dev>",
        to: [user.email],
        subject,
        html,
      }),
    });

    if (!resendResponse.ok) {
      const error = await resendResponse.text();
      logStep("ERROR sending email", { error });
      throw new Error(`Failed to send email: ${error}`);
    }

    const data = await resendResponse.json();
    logStep("Email sent successfully", { emailId: data?.id });

    return new Response(JSON.stringify({ success: true, emailId: data?.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in send-verification-email", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});
