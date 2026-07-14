import "../_shared/resend-guard.ts";
import { emailShell } from "../_shared/brandEmail.ts";
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

    const { bidId, jobId, customerId, agentId } = await req.json();

    // Get job details
    const { data: job } = await supabaseClient
      .from('marketplace_jobs')
      .select('title, contact_info')
      .eq('id', jobId)
      .single();

    // Get bid details
    const { data: bid } = await supabaseClient
      .from('agent_bids')
      .select('customer_facing_price, currency, agent_payout_amount')
      .eq('id', bidId)
      .single();

    // Get agent details
    const { data: agent } = await supabaseClient
      .from('travel_agents')
      .select('agency_name, user_id')
      .eq('id', agentId)
      .single();

    if (!job || !bid || !agent) {
      throw new Error('Job, bid, or agent not found');
    }

    // Get customer email
    const { data: customerProfile } = await supabaseClient
      .from('profiles')
      .select('email')
      .eq('id', customerId)
      .single();

    // Get agent email
    const { data: agentProfile } = agent.user_id ? await supabaseClient
      .from('profiles')
      .select('email')
      .eq('id', agent.user_id)
      .single() : { data: null };

    // Notify customer via in-app notification
    await supabaseClient.from('notifications').insert({
      user_id: customerId,
      type: 'system_announcement',
      title: '🎉 Bid Accepted!',
      message: `Your bid for "${job.title}" has been accepted. Payment of ${bid.currency} ${bid.customer_facing_price} is required to proceed.`,
      entity_type: 'agent_bid',
      entity_id: bidId,
      action_url: `/marketplace`,
    });

    // Notify agent via in-app notification
    if (agent.user_id) {
      await supabaseClient.from('notifications').insert({
        user_id: agent.user_id,
        type: 'system_announcement',
        title: '🎉 Your Bid Was Accepted!',
        message: `Congratulations! Your bid for "${job.title}" has been accepted. The customer will process payment shortly.`,
        entity_type: 'agent_bid',
        entity_id: bidId,
        action_url: `/agent-dashboard`,
      });
    }

    // Send email notifications
    if (Deno.env.get('RESEND_API_KEY')) {
      const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

      // Email to customer
      if (customerProfile?.email) {
        const customerEmailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .section { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; }
              .button { display: inline-block; background: #10b981; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">🎉 Bid Accepted!</h1>
              </div>
              <div class="content">
                <div class="section">
                  <h2 style="margin-top: 0; color: #10b981;">Your trip is moving forward!</h2>
                  <p><strong>Agent:</strong> ${agent.agency_name}</p>
                  <p><strong>Trip:</strong> ${job.title}</p>
                  <p><strong>Total Price:</strong> ${bid.currency} ${bid.customer_facing_price}</p>
                </div>

                <div class="section">
                  <h3 style="margin-top: 0;">Next Steps</h3>
                  <ol>
                    <li>Complete payment to secure your booking</li>
                    <li>Your agent will begin planning immediately</li>
                  <li>You'll receive trip details within 24-48 hours</li>
                  </ol>
                  <a href="${(Deno.env.get('SUPABASE_URL') || '').replace('//', '//app.')}/marketplace?job=${jobId}" class="button">Complete Payment</a>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;

        try {
          const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: 'Goldsainte Marketplace <hello@goldsainte.com>',
              to: [customerProfile.email],
              subject: `Bid accepted — next: your payment for ${job.title}`,
              html: emailShell(
                "Your specialist is confirmed.",
                `You've accepted a bid for <strong>${job.title}</strong>. Next: complete your payment — it's held in Goldsainte's escrow and released to your specialist on agreed milestones, so your booking stays protected.`,
                "Complete payment",
                "https://goldsainte.ai/my-jobs"
              ),
            }),
          });

          if (!resendResponse.ok) {
            const error = await resendResponse.text();
            throw new Error(`Failed to send customer email: ${error}`);
          }

          console.log('Customer email sent:', await resendResponse.json());
        } catch (error) {
          console.error('Error sending customer email:', error);
        }
      }

      // Email to agent
      if (agentProfile?.email) {
        const agentEmailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .section { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">🎉 Congratulations!</h1>
              </div>
              <div class="content">
                <div class="section">
                  <h2 style="margin-top: 0; color: #10b981;">Your bid was accepted!</h2>
                  <p><strong>Trip:</strong> ${job.title}</p>
                  <p><strong>Customer:</strong> ${job.contact_info?.name || 'Customer'}</p>
                  <p><strong>Your Payout:</strong> ${bid.currency} ${bid.agent_payout_amount || bid.customer_facing_price}</p>
                </div>

                <div class="section">
                  <h3 style="margin-top: 0;">Customer Contact Information</h3>
                  <p><strong>Email:</strong> ${job.contact_info?.email || 'Not provided'}</p>
                  <p><strong>Phone:</strong> ${job.contact_info?.phone || 'Not provided'}</p>
                </div>

                <div class="section">
                  <h3 style="margin-top: 0;">Next Steps</h3>
                  <ol>
                    <li>Wait for customer to complete payment</li>
                    <li>Begin planning the trip immediately after payment confirmation</li>
                    <li>Contact the customer within 24 hours</li>
                    <li>Deliver trip details within 48 hours</li>
                  </ol>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;

        try {
          const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: 'Goldsainte Marketplace <hello@goldsainte.com>',
              to: [agentProfile.email],
              subject: `Your bid was accepted — ${job.title}`,
              html: emailShell(
                "Your bid was accepted.",
                `Congratulations — the traveler chose your bid for <strong>${job.title}</strong>. Next: the traveler completes payment into escrow; you'll be notified the moment it lands. Keep all trip details and communication on-platform.`,
                "Open your dashboard",
                "https://goldsainte.ai/agent-dashboard"
              ),
            }),
          });

          if (!resendResponse.ok) {
            const error = await resendResponse.text();
            throw new Error(`Failed to send agent email: ${error}`);
          }

          console.log('Agent email sent:', await resendResponse.json());
        } catch (error) {
          console.error('Error sending agent email:', error);
        }
      }
    }

    console.log(`Bid accepted notifications sent for job ${jobId}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error in notify-bid-accepted:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
