import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  "Vary": "Origin",
};
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { 
      status: 405,
      headers: corsHeaders(req),
    });
  }

  try {
    const { email, firstName } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Missing email address" }),
        { 
          status: 400,
          headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
        },
      );
    }

    if (!RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not set; skipping welcome email");
      return new Response(
        JSON.stringify({ ok: true, skipped: true, reason: "No API key configured" }), 
        {
          status: 200,
          headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
        }
      );
    }

    const name = firstName || "there";

    const emailBody = {
      from: "Goldsainte <hello@goldsainte.com>",
      to: [email],
      subject: "Welcome to Goldsainte – Your Travel Journey Begins",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #0a2225;
                background-color: #f6f3ea;
                margin: 0;
                padding: 0;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 40px 20px;
              }
              .header {
                text-align: center;
                padding: 30px 0;
                background: linear-gradient(135deg, #0a2225 0%, #0c4d47 100%);
                border-radius: 16px 16px 0 0;
              }
              .logo {
                font-size: 32px;
                font-weight: bold;
                color: #BFAD72;
                letter-spacing: -0.5px;
              }
              .content {
                background: white;
                padding: 40px 30px;
                border-radius: 0 0 16px 16px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              }
              h1 {
                color: #0a2225;
                font-size: 24px;
                margin: 0 0 20px 0;
                font-weight: 600;
              }
              p {
                color: #4a4a4a;
                margin: 0 0 15px 0;
                font-size: 15px;
              }
              .features {
                margin: 25px 0;
                padding: 0;
                list-style: none;
              }
              .features li {
                padding: 12px 0;
                padding-left: 30px;
                position: relative;
                color: #4a4a4a;
                font-size: 15px;
              }
              .features li:before {
                content: "✓";
                position: absolute;
                left: 0;
                color: #BFAD72;
                font-weight: bold;
                font-size: 18px;
              }
              .cta {
                text-align: center;
                margin: 30px 0;
              }
              .button {
                display: inline-block;
                padding: 14px 32px;
                background: linear-gradient(135deg, #BFAD72 0%, #d4c58d 100%);
                color: #0a2225;
                text-decoration: none;
                border-radius: 25px;
                font-weight: 600;
                font-size: 15px;
                transition: transform 0.2s;
              }
              .button:hover {
                transform: translateY(-1px);
              }
              .footer {
                text-align: center;
                padding: 20px;
                color: #8D8D8D;
                font-size: 12px;
              }
              .footer a {
                color: #BFAD72;
                text-decoration: none;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">Goldsainte</div>
              </div>
              <div class="content">
                <h1>Welcome to Goldsainte, ${name}!</h1>
                <p>
                  Your account is now active and ready to use. We're thrilled to have you join our
                  community of travelers, creators, and travel agents.
                </p>
                <p>
                  Goldsainte is your <strong>AI-powered travel concierge</strong> that connects you with
                  TikTok travel creators and expert agents to craft unforgettable journeys.
                </p>
                
                <ul class="features">
                  <li>
                    <strong>Post Your Dream Trip:</strong> Share where you want to go and receive
                    curated proposals from verified agents and creators
                  </li>
                  <li>
                    <strong>Discover Creator Experiences:</strong> Browse trips curated by TikTok
                    travel creators and book directly through the platform
                  </li>
                  <li>
                    <strong>Secure Marketplace:</strong> All bookings are protected with escrow,
                    cancellation policies, and dispute resolution
                  </li>
                  <li>
                    <strong>AI Concierge:</strong> Get personalized recommendations and real-time
                    assistance throughout your journey
                  </li>
                </ul>

                <div class="cta">
                  <a href="${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app') || "https://app.goldsainte.com"}" class="button">
                    Start Exploring
                  </a>
                </div>

                <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5DFC6;">
                  Questions? Our support team is here to help. Just reply to this email or visit our
                  <a href="https://goldsainte.com/help" style="color: #BFAD72;">Help Center</a>.
                </p>

                <p style="font-size: 13px; color: #8D8D8D; margin-top: 20px;">
                  Safe travels,<br>
                  <strong style="color: #0a2225;">The Goldsainte Team</strong>
                </p>
              </div>
              <div class="footer">
                <p>
                  © ${new Date().getFullYear()} Goldsainte. All rights reserved.<br>
                  <a href="https://goldsainte.com/privacy">Privacy Policy</a> • 
                  <a href="https://goldsainte.com/terms">Terms of Service</a>
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailBody),
    });

    if (!resendRes.ok) {
      const errorText = await resendRes.text();
      console.error("Resend API error:", errorText);
      return new Response(
        JSON.stringify({ 
          error: "Failed to send welcome email", 
          details: errorText 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
        },
      );
    }

    const result = await resendRes.json();
    console.log("Welcome email sent successfully:", result);

    return new Response(
      JSON.stringify({ ok: true, emailId: result.id }), 
      { 
        status: 200,
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error("welcome-email error:", err);
    return new Response(
      JSON.stringify({ 
        error: "Unexpected error", 
        details: err?.message || String(err) 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      },
    );
  }
});
