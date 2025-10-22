import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      travelerInfo, 
      travelDetails,
      conversationData, 
      inquirySource = 'ai_chat',
      priority = 'medium'
    } = await req.json();

    console.log('Creating agent inquiry:', { travelerInfo, inquirySource });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    let userId = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    const additionalEmails = travelerInfo.additionalEmails || [];

    const { data: inquiry, error: inquiryError } = await supabase
      .from('agent_inquiries')
      .insert({
        user_id: userId,
        guest_name: travelerInfo.name,
        guest_email: travelerInfo.email,
        guest_phone: travelerInfo.phone,
        additional_emails: additionalEmails,
        inquiry_source: inquirySource,
        conversation_data: { travelerInfo, travelDetails, ...conversationData },
        status: 'pending',
        priority: priority
      })
      .select()
      .single();

    if (inquiryError) throw inquiryError;

    const referenceNumber = `INQ-${inquiry.id.slice(0, 8).toUpperCase()}`;

    // Convert to marketplace job
    const { data: jobResult } = await supabase.functions.invoke(
      'convert-inquiry-to-marketplace-job',
      { body: { inquiryId: inquiry.id } }
    );

    const jobId = jobResult?.jobId;

    // Trigger AI matching
    await supabase.functions.invoke('ai-agent-matching', {
      body: { jobId, inquiryId: inquiry.id, conversationData }
    });

    // Notify agents
    if (jobId) {
      await supabase.functions.invoke('notify-agents-new-job', {
        body: { 
          jobId,
          title: jobResult.jobTitle,
          destination: travelDetails?.destination,
          budget: travelDetails?.budget?.amount,
          currency: travelDetails?.budget?.currency || 'USD'
        }
      });
    }

    // Send confirmation email
    await supabase.functions.invoke('send-traveler-confirmation-email', {
      body: { inquiryId: inquiry.id, jobId, referenceNumber }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        inquiryId: inquiry.id,
        jobId,
        jobUrl: jobResult?.jobUrl,
        referenceNumber,
        message: "Your request has been posted to our agent marketplace!",
        contactEmail: travelerInfo.email,
        contactPhone: travelerInfo.phone,
        estimatedResponseTime: "2-4 hours",
        nextSteps: [
          "Your trip is now live in the marketplace",
          "AI matched you with certified agents",
          "Agents will submit bids within 2-4 hours",
          `You'll be notified at ${travelerInfo.email}`,
          `Track bids at ${jobResult?.jobUrl || '/marketplace'}`
        ]
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create-agent-inquiry:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
