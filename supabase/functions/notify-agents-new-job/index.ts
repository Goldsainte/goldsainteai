import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  "Vary": "Origin",
};
}

const resendApiKey = Deno.env.get('RESEND_API_KEY');
const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const { jobId, jobTitle, jobDescription, destination, budgetMin, budgetMax } = await req.json();

    console.log('Notifying agents about new job:', jobId);

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all active and verified travel agents
    const { data: agents, error: agentsError } = await supabaseClient
      .from('travel_agents')
      .select('id, email, phone, whatsapp_number, agency_name, primary_contact_name, email_notifications_enabled, sms_notifications_enabled, whatsapp_notifications_enabled')
      .eq('is_active', true)
      .eq('is_verified', true);

    if (agentsError) {
      console.error('Error fetching agents:', agentsError);
      throw agentsError;
    }

    if (!agents || agents.length === 0) {
      console.log('No agents to notify');
      return new Response(
        JSON.stringify({ message: 'No agents to notify', notified: 0 }),
        { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const notificationPromises = [];

    for (const agent of agents) {
      const message = `New job posted on the marketplace!\n\nTitle: ${jobTitle}\nDestination: ${destination}\nBudget: $${budgetMin} - $${budgetMax}\n\nLog in to view details and place your bid!`;

      // Send Email via Resend (only if opted in)
      if (agent.email && resendApiKey && agent.email_notifications_enabled) {
        notificationPromises.push(
          fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Luxury Travel <onboarding@resend.dev>',
              to: [agent.email],
              subject: `New Travel Job: ${jobTitle}`,
              html: `
                <h2>New Job Opportunity!</h2>
                <p>Hello ${agent.primary_contact_name || agent.agency_name},</p>
                <p>A new job has been posted on the marketplace that might interest you:</p>
                <ul>
                  <li><strong>Title:</strong> ${jobTitle}</li>
                  <li><strong>Description:</strong> ${jobDescription}</li>
                  <li><strong>Destination:</strong> ${destination}</li>
                  <li><strong>Budget:</strong> $${budgetMin} - $${budgetMax}</li>
                </ul>
                <p>Log in to your agent dashboard to view full details and place your bid!</p>
                <p>Best regards,<br/>The Luxury Travel Team</p>
              `,
            }),
          })
            .then((response) => response.json())
            .then((data) => {
              console.log(`Email sent to ${agent.email}:`, data);
              return data;
            })
            .catch((error) => {
              console.error(`Failed to send email to ${agent.email}:`, error);
              return null;
            })
        );
      }

      // Send SMS via Twilio (only if opted in)
      if (agent.phone && twilioAccountSid && twilioAuthToken && twilioPhoneNumber && agent.sms_notifications_enabled) {
        const smsUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
        notificationPromises.push(
          fetch(smsUrl, {
            method: 'POST',
            headers: {
              'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              To: agent.phone,
              From: twilioPhoneNumber,
              Body: message,
            }),
          })
            .then((response) => response.json())
            .then((data) => {
              console.log(`SMS sent to ${agent.phone}:`, data);
              return data;
            })
            .catch((error) => {
              console.error(`Failed to send SMS to ${agent.phone}:`, error);
              return null;
            })
        );
      }

      // Send WhatsApp message via Twilio (only if opted in)
      if (agent.whatsapp_number && twilioAccountSid && twilioAuthToken && twilioPhoneNumber && agent.whatsapp_notifications_enabled) {
        const whatsappUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
        notificationPromises.push(
          fetch(whatsappUrl, {
            method: 'POST',
            headers: {
              'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              To: `whatsapp:${agent.whatsapp_number}`,
              From: `whatsapp:${twilioPhoneNumber}`,
              Body: message,
            }),
          })
            .then((response) => response.json())
            .then((data) => {
              console.log(`WhatsApp sent to ${agent.whatsapp_number}:`, data);
              return data;
            })
            .catch((error) => {
              console.error(`Failed to send WhatsApp to ${agent.whatsapp_number}:`, error);
              return null;
            })
        );
      }
    }

    // Wait for all notifications to complete
    await Promise.all(notificationPromises);

    console.log(`Successfully notified ${agents.length} agents`);

    return new Response(
      JSON.stringify({ message: 'Agents notified successfully', notified: agents.length }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error in notify-agents-new-job function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});