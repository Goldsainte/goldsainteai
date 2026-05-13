import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
};
}

interface WelcomeEmailRequest {
  email: string;
  accountType: "traveler" | "creator" | "agent";
  fullName?: string;
  displayName?: string;
}

const getEmailContent = (accountType: string, name: string) => {
  if (accountType === "traveler") {
    return {
      subject: "Welcome to Goldsainte — your trips now have a creative team",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h1 style="color: #BFAD72; font-size: 24px; margin-bottom: 20px;">Hi ${name},</h1>
          
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
            You're in. Your Goldsainte account is set up as a <strong>Traveler</strong>.
          </p>
          
          <h2 style="color: #0a2225; font-size: 18px; margin-top: 24px; margin-bottom: 16px;">
            Here's what you can do next:
          </h2>
          
          <div style="margin-bottom: 16px;">
            <h3 style="color: #BFAD72; font-size: 16px; margin-bottom: 8px;">Post a trip brief</h3>
            <p style="font-size: 14px; line-height: 1.6; color: #666;">
              Tell us where you're going, your budget, and the vibe. We'll surface travel agents and TikTok creators who actually fit your style.
            </p>
          </div>
          
          <div style="margin-bottom: 16px;">
            <h3 style="color: #BFAD72; font-size: 16px; margin-bottom: 8px;">Review proposals</h3>
            <p style="font-size: 14px; line-height: 1.6; color: #666;">
              Agents and creators respond with concepts, pricing, and what they'd design for you. You stay in one secure chat, on platform.
            </p>
          </div>
          
          <div style="margin-bottom: 16px;">
            <h3 style="color: #BFAD72; font-size: 16px; margin-bottom: 8px;">See the trip as a storyboard</h3>
            <p style="font-size: 14px; line-height: 1.6; color: #666;">
              Before you ever pay, your journey is visualized like a Pinterest board or TikTok shot list: hotels, moments, and experiences.
            </p>
          </div>
          
          <div style="margin-bottom: 24px;">
            <h3 style="color: #BFAD72; font-size: 16px; margin-bottom: 8px;">Book through Goldsainte</h3>
            <p style="font-size: 14px; line-height: 1.6; color: #666;">
              Payments, changes, and disputes are all handled in one place so you stay protected — and your team gets paid fairly.
            </p>
          </div>
          
          <div style="background: #f6f3ea; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <p style="font-size: 14px; margin: 0; color: #0a2225;">
              <strong>Your next step:</strong><br/>
              Log in and go to "Post a Trip" to share your first brief.
            </p>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee;">
            <strong>Goldsainte</strong><br/>
            Travel, designed like content — delivered like luxury.
          </p>
        </div>
      `,
    };
  } else if (accountType === "creator") {
    return {
      subject: "Welcome to Goldsainte — creators get to co-own the trip",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h1 style="color: #BFAD72; font-size: 24px; margin-bottom: 20px;">Hi ${name},</h1>
          
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
            Your Goldsainte account is set up as a <strong>Creator</strong>.
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            You're here because your content doesn't just inspire trips — it should also earn from them.
          </p>
          
          <h2 style="color: #0a2225; font-size: 18px; margin-top: 24px; margin-bottom: 16px;">
            Here's what you can do on Goldsainte:
          </h2>
          
          <div style="margin-bottom: 16px;">
            <h3 style="color: #BFAD72; font-size: 16px; margin-bottom: 8px;">Respond to traveler briefs</h3>
            <p style="font-size: 14px; line-height: 1.6; color: #666;">
              Browse trip requests and raise your hand for the ones that match your audience and aesthetic.
            </p>
          </div>
          
          <div style="margin-bottom: 16px;">
            <h3 style="color: #BFAD72; font-size: 16px; margin-bottom: 8px;">Design storyboards</h3>
            <p style="font-size: 14px; line-height: 1.6; color: #666;">
              Use our Pinterest-style storyboard tool to map out each trip like a TikTok series: arrival, reveals, golden hour, hero moments.
            </p>
          </div>
          
          <div style="margin-bottom: 16px;">
            <h3 style="color: #BFAD72; font-size: 16px; margin-bottom: 8px;">Partner with travel agents</h3>
            <p style="font-size: 14px; line-height: 1.6; color: #666;">
              Agents handle contracts and logistics. You focus on story, vibe, and what will make this trip shareable.
            </p>
          </div>
          
          <div style="margin-bottom: 24px;">
            <h3 style="color: #BFAD72; font-size: 16px; margin-bottom: 8px;">Earn when trips get booked</h3>
            <p style="font-size: 14px; line-height: 1.6; color: #666;">
              When travelers book through Goldsainte, your creator share is tracked and paid out from your earnings dashboard.
            </p>
          </div>
          
          <div style="background: #f6f3ea; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <p style="font-size: 14px; margin: 0; color: #0a2225;">
              <strong>Your next step:</strong><br/>
              Complete your TikTok handle in your profile and explore the marketplace for briefs that fit your brand.
            </p>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee;">
            <strong>Goldsainte</strong><br/>
            Where travel is designed like content — and creators get a real seat at the table.
          </p>
        </div>
      `,
    };
  } else {
    // agent
    return {
      subject: "Welcome to Goldsainte — luxury logistics meet creator energy",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h1 style="color: #BFAD72; font-size: 24px; margin-bottom: 20px;">Hi ${name},</h1>
          
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
            Your Goldsainte account is set up as a <strong>Travel Agent</strong>.
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            Goldsainte is where your contracts and expertise pair with creator reach and traveler demand.
          </p>
          
          <h2 style="color: #0a2225; font-size: 18px; margin-top: 24px; margin-bottom: 16px;">
            Here's how it works for you:
          </h2>
          
          <div style="margin-bottom: 16px;">
            <h3 style="color: #BFAD72; font-size: 16px; margin-bottom: 8px;">Receive qualified briefs</h3>
            <p style="font-size: 14px; line-height: 1.6; color: #666;">
              Travelers share real dates, budgets, and styles. You decide which trips to pitch.
            </p>
          </div>
          
          <div style="margin-bottom: 16px;">
            <h3 style="color: #BFAD72; font-size: 16px; margin-bottom: 8px;">Co-design with creators</h3>
            <p style="font-size: 14px; line-height: 1.6; color: #666;">
              Partner with TikTok creators who bring the storytelling and audience. You bring inventory, upgrades, and reliability.
            </p>
          </div>
          
          <div style="margin-bottom: 16px;">
            <h3 style="color: #BFAD72; font-size: 16px; margin-bottom: 8px;">Build bookable experiences</h3>
            <p style="font-size: 14px; line-height: 1.6; color: #666;">
              From our storyboard view to the final itinerary, you remain the backbone of the trip.
            </p>
          </div>
          
          <div style="margin-bottom: 24px;">
            <h3 style="color: #BFAD72; font-size: 16px; margin-bottom: 8px;">Earn on every confirmed booking</h3>
            <p style="font-size: 14px; line-height: 1.6; color: #666;">
              Bookings and payouts are tracked transparently in your Goldsainte earnings dashboard.
            </p>
          </div>
          
          <div style="background: #f6f3ea; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <p style="font-size: 14px; margin: 0; color: #0a2225;">
              <strong>Your next step:</strong><br/>
              Add your agency name and specialties in your profile and start responding to briefs that match your strengths.
            </p>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee;">
            <strong>Goldsainte</strong><br/>
            Designed for agents who want more than just another OTA listing.
          </p>
        </div>
      `,
    };
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const { email, accountType, fullName, displayName }: WelcomeEmailRequest =
      await req.json();

    const name = displayName || fullName || "there";
    const { subject, html } = getEmailContent(accountType, name);

    const emailResponse = await resend.emails.send({
      from: "Goldsainte <onboarding@resend.dev>",
      to: [email],
      subject,
      html,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders(req),
      },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders(req) },
    });
  }
};

serve(handler);
