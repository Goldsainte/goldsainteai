import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  // Check for API key first
  if (!RESEND_API_KEY) {
    console.error("❌ RESEND_API_KEY is not set in Edge Function environment");
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "RESEND_API_KEY is not configured in Edge Function secrets" 
      }),
      { status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    );
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    console.log("✅ RESEND_API_KEY is set. Attempting to send test email to:", email);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Goldsainte Security <security@goldsainte.ai>",
        to: [email],
        subject: "Resend Test from Goldsainte",
        html: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #0a2225; font-size: 24px;">✅ Resend is Working!</h1>
            <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
              If you see this email, it means:
            </p>
            <ul style="color: #4a4a4a; font-size: 16px; line-height: 1.8;">
              <li>The RESEND_API_KEY is valid</li>
              <li>The sending domain (goldsainte.ai) is verified</li>
              <li>Resend is successfully delivering emails</li>
            </ul>
            <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
              — Goldsainte Test Function
            </p>
          </div>
        `,
      }),
    });

    const body = await res.json();

    if (!res.ok) {
      console.error("❌ Resend API error:", body);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: body.message || "Resend API error",
          details: body 
        }),
        { status: res.status, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Test email sent successfully:", body);
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Test email sent successfully",
        resend_response: body 
      }),
      { status: 200, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ Error in test-resend function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Internal server error" 
      }),
      { status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
