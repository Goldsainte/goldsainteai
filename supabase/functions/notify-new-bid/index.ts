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

    const { bidId, jobId } = await req.json();

    // Get job details
    const { data: job } = await supabaseClient
      .from('marketplace_jobs')
      .select('title, user_id')
      .eq('id', jobId)
      .single();

    // Get bid details
    const { data: bid } = await supabaseClient
      .from('agent_bids')
      .select('customer_facing_price, currency, agent_id')
      .eq('id', bidId)
      .single();

    // Get agent details
    const { data: agent } = await supabaseClient
      .from('travel_agents')
      .select('agency_name')
      .eq('id', bid?.agent_id)
      .single();

    if (!job || !bid) {
      throw new Error('Job or bid not found');
    }

    // Notify customer via in-app notification
    await supabaseClient.from('notifications').insert({
      user_id: job.user_id,
      type: 'new_bid',
      title: '📬 New Bid Received!',
      message: `${agent?.agency_name || 'An agent'} placed a bid of ${bid.currency} ${bid.customer_facing_price} on "${job.title}".`,
      entity_type: 'agent_bid',
      entity_id: bidId,
      action_url: `/marketplace`,
    });

    // Send email notification to customer
    if (Deno.env.get('RESEND_API_KEY')) {
      // Get customer email
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('email')
        .eq('id', job.user_id)
        .single();

      if (profile?.email) {
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .section { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; }
              .price { font-size: 32px; color: #667eea; font-weight: bold; text-align: center; margin: 20px 0; }
              .button { display: inline-block; background: #667eea; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">📬 New Bid Received!</h1>
              </div>
              <div class="content">
                <div class="section">
                  <h2 style="margin-top: 0; color: #667eea;">${agent?.agency_name || 'An Agent'} submitted a bid</h2>
                  <p><strong>Trip:</strong> ${job.title}</p>
                  <div class="price">${bid.currency} ${bid.customer_facing_price}</div>
                </div>

                <div class="section">
                  <h3 style="margin-top: 0;">Next Steps</h3>
                  <p>Review this bid along with any others you've received and choose the agent that best fits your needs.</p>
                  <a href="${(Deno.env.get('SUPABASE_URL') || '').replace('//', '//app.')}/marketplace?job=${jobId}" class="button">Review Bid</a>
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
              'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
            },
            body: JSON.stringify({
              from: 'Goldsainte Marketplace <hello@goldsainte.com>',
              to: [profile.email],
              subject: `📬 New Bid: ${bid.currency} ${bid.customer_facing_price} for ${job.title}`,
              html: emailHtml,
            }),
          });

          if (!resendResponse.ok) {
            const error = await resendResponse.text();
            throw new Error(`Failed to send email: ${error}`);
          }

          const data = await resendResponse.json();
          console.log('Bid notification email sent to:', profile.email, 'ID:', data?.id);
        } catch (emailError) {
          console.error('Error sending bid email:', emailError);
        }
      }
    }

    console.log(`New bid notification sent for job ${jobId}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error in notify-new-bid:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
