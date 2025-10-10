import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerificationEmailRequest {
  email: string;
  token_hash: string;
  token: string;
  redirect_to?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, token_hash, token, redirect_to }: VerificationEmailRequest = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const verificationUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=email&redirect_to=${redirect_to || supabaseUrl}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0A0F1C;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0A0F1C;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);">
                
                <!-- Hero Image -->
                <tr>
                  <td style="padding: 0;">
                    <img src="https://iwdevxltjuedijrcdejs.supabase.co/storage/v1/object/public/avatars/email-hero-luxury.jpg" alt="Luxury Travel" style="width: 100%; height: 200px; object-fit: cover; display: block;" />
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 48px 40px;">
                    
                    <!-- Logo/Brand -->
                    <table role="presentation" style="width: 100%; margin-bottom: 32px;">
                      <tr>
                        <td align="center">
                          <div style="font-size: 32px; font-weight: 700; background: linear-gradient(135deg, #D4AF37 0%, #F4E5B1 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; letter-spacing: 1px;">
                            LUXURY TRAVEL
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- Welcome Message -->
                    <table role="presentation" style="width: 100%; margin-bottom: 32px;">
                      <tr>
                        <td style="color: #F8FAFC; font-size: 28px; font-weight: 700; text-align: center; margin-bottom: 16px; line-height: 1.3;">
                          Verify Your Email Address
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #CBD5E1; font-size: 16px; line-height: 1.6; text-align: center; padding-top: 16px;">
                          Thank you for joining our exclusive luxury travel community. We're excited to help you discover extraordinary destinations around the world.
                        </td>
                      </tr>
                    </table>

                    <!-- Verification Button -->
                    <table role="presentation" style="width: 100%; margin: 40px 0;">
                      <tr>
                        <td align="center">
                          <a href="${verificationUrl}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #D4AF37 0%, #F4E5B1 100%); color: #0F172A; text-decoration: none; font-weight: 700; font-size: 16px; border-radius: 8px; letter-spacing: 0.5px; box-shadow: 0 8px 24px rgba(212, 175, 55, 0.3);">
                            VERIFY EMAIL ADDRESS
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Verification Code -->
                    <table role="presentation" style="width: 100%; margin: 32px 0;">
                      <tr>
                        <td style="color: #94A3B8; font-size: 14px; text-align: center; margin-bottom: 12px;">
                          Or enter this verification code:
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding-top: 12px;">
                          <div style="display: inline-block; padding: 16px 32px; background-color: #1E293B; border: 2px solid #334155; border-radius: 8px; font-family: 'Courier New', monospace; font-size: 24px; font-weight: 700; color: #D4AF37; letter-spacing: 4px;">
                            ${token}
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- Expiry Notice -->
                    <table role="presentation" style="width: 100%; margin: 32px 0;">
                      <tr>
                        <td style="color: #64748B; font-size: 13px; text-align: center; line-height: 1.5;">
                          This verification link will expire in 24 hours for your security.
                        </td>
                      </tr>
                    </table>

                    <!-- Security Notice -->
                    <table role="presentation" style="width: 100%; margin: 32px 0; padding: 20px; background-color: rgba(212, 175, 55, 0.1); border-left: 4px solid #D4AF37; border-radius: 4px;">
                      <tr>
                        <td style="color: #CBD5E1; font-size: 13px; line-height: 1.6;">
                          <strong style="color: #D4AF37;">Security Notice:</strong> If you didn't create an account with us, please ignore this email. Your security is our top priority.
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 32px 40px; background-color: #0F172A; border-top: 1px solid #334155;">
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="color: #64748B; font-size: 12px; line-height: 1.6; text-align: center;">
                          <p style="margin: 0 0 8px 0;">This email was sent to ${email}</p>
                          <p style="margin: 0 0 16px 0;">© 2025 Luxury Travel Platform. All rights reserved.</p>
                          <p style="margin: 0; color: #475569;">
                            Experience the world's finest destinations with personalized service and exclusive access.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Luxury Travel <onboarding@resend.dev>",
      to: [email],
      subject: "Verify Your Email - Luxury Travel Platform",
      html: emailHtml,
    });

    console.log("Verification email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-verification-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
