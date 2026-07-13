import "../_shared/resend-guard.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  "Vary": "Origin",
};
}



Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { inquiryId, jobId, referenceNumber } = await req.json();

    // Fetch inquiry and job details
    const { data: inquiry } = await supabaseClient
      .from('agent_inquiries')
      .select('*')
      .eq('id', inquiryId)
      .single();

    const { data: job } = await supabaseClient
      .from('marketplace_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (!inquiry || !job) {
      throw new Error('Inquiry or job not found');
    }

    const travelDetails = inquiry.conversation_data?.travelDetails || {};
    const dashboardUrl = `${(Deno.env.get('SUPABASE_URL') || '').replace('//', '//app.')}/marketplace?job=${jobId}`;

    // Send confirmation email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #0a2225; background: #f7f3ea; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0c4d47; color: #f7f3ea; padding: 30px; text-align: center; border-radius: 2px 2px 0 0; }
          .content { background: #ffffff; padding: 30px; border-radius: 0 0 2px 2px; border: 1px solid #E5DFC6; border-top: 0; }
          .section { background: #FDF9F0; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #C7A962; }
          .highlight { background: #F6F0E4; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .button { display: inline-block; background: #0c4d47; color: #f7f3ea !important; padding: 18px 40px; text-decoration: none; border-radius: 2px; margin: 20px 0; font-size: 13px; letter-spacing: 0.18em; text-transform: uppercase; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          .check { color: #10b981; font-size: 18px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">✓ Trip Request Confirmed</h1>
            <p style="margin: 10px 0 0 0;">Reference: ${referenceNumber}</p>
          </div>
          <div class="content">
            <div class="section">
              <h2 style="margin-top: 0; color: #0c4d47;">Your Request Details</h2>
              <p><strong>Destination:</strong> ${job.destination}</p>
              ${travelDetails.departureDate ? `<p><strong>Departure:</strong> ${travelDetails.departureDate}</p>` : ''}
              ${travelDetails.returnDate ? `<p><strong>Return:</strong> ${travelDetails.returnDate}</p>` : ''}
              ${travelDetails.travelers ? `<p><strong>Travelers:</strong> ${travelDetails.travelers.adults || 1} adult(s)</p>` : ''}
              ${job.budget_max ? `<p><strong>Budget:</strong> Up to ${job.currency} ${job.budget_max}</p>` : ''}
            </div>

            <div class="highlight">
              <h3 style="margin-top: 0;"><span class="check">✓</span> What Happens Next</h3>
              <p><strong>1. AI Matching in Progress</strong><br/>
              Our AI is analyzing your requirements and matching you with certified agents who specialize in your destination and travel type.</p>
              
              <p><strong>2. Agents Review Your Request</strong><br/>
              Top-matched agents (typically 3-8) will receive your trip details and can submit custom proposals.</p>
              
              <p><strong>3. You Receive Bids (2-4 hours)</strong><br/>
              Most agents respond within 2-4 hours. You'll receive email notifications when bids arrive.</p>
              
              <p><strong>4. Compare & Choose</strong><br/>
              Review proposals, compare pricing and services, then select the agent that best fits your needs.</p>
              
              <p><strong>5. Your Agent Takes Over</strong><br/>
              Once you accept a bid, your chosen agent will handle all the planning and booking.</p>
            </div>

            <div class="section">
              <h3 style="margin-top: 0;">Track Your Bids</h3>
              <p>View incoming proposals and manage your trip request in real-time:</p>
              <a href="${dashboardUrl}" class="button">View Marketplace Dashboard</a>
            </div>

            <div class="section">
              <h3 style="margin-top: 0;">Contact Information</h3>
              <p>We'll contact you at:</p>
              <p><strong>Email:</strong> ${inquiry.guest_email}<br/>
              <strong>Phone:</strong> ${inquiry.guest_phone || 'Not provided'}</p>
            </div>

            <div class="footer">
              <p>Reference Number: ${referenceNumber}<br/>
              Keep this for tracking your request.</p>
              <p>Questions? Reply to this email or contact our support team.</p>
              <p style="margin-top: 20px;">© ${new Date().getFullYear()} Goldsainte Travel. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    if (Deno.env.get('RESEND_API_KEY')) {
      try {
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
          },
          body: JSON.stringify({
            from: 'Goldsainte Travel <hello@goldsainte.com>',
            to: [inquiry.guest_email],
            subject: `Trip Request Confirmed - ${job.destination} (${referenceNumber})`,
            html: emailHtml,
          }),
        });

        if (!resendResponse.ok) {
          const error = await resendResponse.text();
          throw new Error(`Failed to send email: ${error}`);
        }

        const data = await resendResponse.json();
        console.log('Confirmation email sent to:', inquiry.guest_email, 'ID:', data?.id);
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
      }
    } else {
      console.log('RESEND_API_KEY not configured, skipping email');
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error in send-traveler-confirmation-email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
