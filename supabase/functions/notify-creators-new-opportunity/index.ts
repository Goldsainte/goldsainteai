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

    const { jobId, matchedCreatorIds } = await req.json();

    // Fetch job details
    const { data: job } = await supabaseClient
      .from('marketplace_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (!job) {
      throw new Error('Job not found');
    }

    // Fetch matched creators
    const { data: creators } = await supabaseClient
      .from('profiles')
      .select('id, username, email')
      .in('id', matchedCreatorIds);

    if (!creators || creators.length === 0) {
      console.log('No matched creators found');
      return new Response(
        JSON.stringify({ success: true, message: 'No creators to notify' }),
        { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const jobUrl = `${(Deno.env.get('SUPABASE_URL') || '').replace('//', '//app.')}/marketplace?job=${jobId}`;

    // Send notifications to each creator
    for (const creator of creators) {
      // Create in-app notification
      await supabaseClient.from('notifications').insert({
        user_id: creator.id,
        type: 'system_announcement',
        title: '🎨 New CoCurated Trip Opportunity',
        message: `A traveler is looking for a content creator to design their ${job.destination} experience. This matches your profile!`,
        entity_type: 'marketplace_job',
        entity_id: jobId,
        action_url: `/marketplace?job=${jobId}`,
      });

      // Send email notification
      if (creator.email && Deno.env.get('RESEND_API_KEY')) {
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .badge { background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
              .section { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; }
              .button { display: inline-block; background: #f59e0b; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">🎨 New CoCurated Opportunity</h1>
                <p style="margin: 10px 0 0 0;"><span class="badge">CONTENT CREATOR</span></p>
              </div>
              <div class="content">
                <div class="section">
                  <h2 style="margin-top: 0; color: #f59e0b;">Trip Details</h2>
                  <p><strong>Destination:</strong> ${job.destination}</p>
                  ${job.budget_max ? `<p><strong>Budget:</strong> ${job.currency} ${job.budget_max}</p>` : ''}
                  <p><strong>Type:</strong> ${job.booking_type}</p>
                  <p><strong>Description:</strong></p>
                  <p>${job.description.substring(0, 200)}...</p>
                </div>

                <div class="section">
                  <h3 style="margin-top: 0;">Why You're Matched</h3>
                  <p>Our AI matched you with this opportunity based on your content style, destination expertise, and audience engagement.</p>
                  <p><strong>What You Can Offer:</strong></p>
                  <ul>
                    <li>Design a unique, Instagram-worthy itinerary</li>
                    <li>Share insider tips and hidden gems</li>
                    <li>Create content from the trip</li>
                    <li>Earn commission on the booking</li>
                  </ul>
                </div>

                <a href="${jobUrl}" class="button">View Opportunity & Submit Proposal</a>

                <p style="text-align: center; color: #666; font-size: 14px;">
                  This is a CoCurated opportunity. Submit your creative proposal to win this collaboration!
                </p>
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
              from: 'Goldsainte Creators <creators@goldsainte.com>',
              to: [creator.email],
              subject: `🎨 New CoCurated Trip to ${job.destination}`,
              html: emailHtml,
            }),
          });

          if (!resendResponse.ok) {
            const error = await resendResponse.text();
            throw new Error(`Failed to send email: ${error}`);
          }

          const data = await resendResponse.json();
          console.log('Creator notification sent to:', creator.email, 'ID:', data?.id);
        } catch (emailError) {
          console.error('Error sending creator email:', emailError);
        }
      }
    }

    console.log(`Notified ${creators.length} creators for job ${jobId}`);

    return new Response(
      JSON.stringify({ success: true, notifiedCount: creators.length }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error in notify-creators-new-opportunity:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
