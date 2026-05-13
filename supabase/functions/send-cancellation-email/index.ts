import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { resolveAllowedOrigin } from "../_shared/cors.ts";


function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
};
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const { email, bookingReference, bookingData, refundAmount, refundCurrency } = await req.json();

    if (!email) {
      throw new Error('Email address is required');
    }

    console.log('Sending cancellation email to:', email);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Gupter', Arial, sans-serif; margin: 0; padding: 0; background-color: #E5DFC6; }
            .container { max-width: 640px; margin: 0 auto; background: #ffffff; }
            .header { background: transparent; padding: 24px; text-align: center; }
            .logo { max-width: 280px; height: auto; }
            .content { padding: 32px 24px; }
            h1 { font-family: 'Chiffon', serif; font-size: 32px; color: #0c4d47; margin: 0 0 16px 0; }
            p { font-size: 16px; line-height: 24px; color: #333333; margin: 16px 0; }
            .info-box { border: 1px solid #e7e7e7; border-radius: 4px; padding: 16px; margin: 16px 0; }
            .info-row { padding: 8px 0; }
            .label { color: #595959; font-size: 14px; }
            .value { color: #333333; font-weight: 600; font-size: 16px; }
            .refund-box { background: #f0fdf4; border: 1px solid #86efac; border-radius: 4px; padding: 16px; margin: 24px 0; }
            .footer { background: #BFAD72; text-align: center; padding: 24px; color: #0A2225; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="https://iwdevxltjuedijrcdejs.supabase.co/storage/v1/object/public/assets/logo-horizontal-green.png" alt="GoldSainte" class="logo" />
            </div>
            
            <div class="content">
              <h1>Booking Cancelled</h1>
              
              <p>Dear Valued Guest,</p>
              
              <p>We've received your request to cancel your booking. Your cancellation has been processed successfully.</p>
              
              <div class="info-box">
                <div class="info-row">
                  <div class="label">Confirmation Number</div>
                  <div class="value">${bookingReference}</div>
                </div>
                ${bookingData?.origin ? `
                <div class="info-row">
                  <div class="label">Route</div>
                  <div class="value">${bookingData.origin} → ${bookingData.destination}</div>
                </div>
                ` : ''}
              </div>
              
              ${refundAmount ? `
              <div class="refund-box">
                <h3 style="margin: 0 0 8px 0; color: #166534;">Refund Information</h3>
                <p style="margin: 0; color: #166534;">
                  A refund of <strong>${refundCurrency} $${Number(refundAmount).toFixed(2)}</strong> 
                  has been processed to your original payment method.
                </p>
                <p style="margin: 8px 0 0 0; font-size: 14px; color: #166534;">
                  Please allow 5-10 business days for the refund to appear in your account.
                </p>
              </div>
              ` : ''}
              
              <p>If you have any questions or need assistance with a new booking, please don't hesitate to contact our 24/7 Concierge Support Team.</p>
              
              <p style="margin-top: 32px;">
                Thank you for choosing GoldSainte.<br>
                We hope to serve you again in the future.
              </p>
            </div>
            
            <div class="footer">
              <p style="margin: 0 0 8px 0;">Thank you for choosing GoldSainte</p>
              <p style="margin: 8px 0; font-size: 11px;">Need assistance? Contact our 24/7 Concierge Support Team</p>
              <p style="margin: 0; font-size: 11px;">© 2025 GoldSainte. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      },
      body: JSON.stringify({
        from: "GoldSainte <onboarding@resend.dev>",
        to: [email],
        subject: `Booking Cancelled - ${bookingReference}`,
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      throw new Error(`Failed to send cancellation email: ${errorText}`);
    }

    const data = await resendResponse.json();
    console.log("Cancellation email sent successfully:", data);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error sending cancellation email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      }
    );
  }
});