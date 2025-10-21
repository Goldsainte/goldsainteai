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
      conversationData, 
      inquirySource = 'ai_chat',
      priority = 'medium'
    } = await req.json();

    console.log('Creating agent inquiry:', { travelerInfo, inquirySource });

    // Create Supabase client with service role for writing
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Try to get authenticated user
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    // Extract additional emails from travelerInfo
    const additionalEmails = travelerInfo.additionalEmails || [];

    // Create the inquiry
    const { data: inquiry, error: inquiryError } = await supabase
      .from('agent_inquiries')
      .insert({
        user_id: userId,
        guest_name: travelerInfo.name,
        guest_email: travelerInfo.email,
        guest_phone: travelerInfo.phone,
        additional_emails: additionalEmails,
        inquiry_source: inquirySource,
        conversation_data: conversationData || {},
        status: 'pending',
        priority: priority
      })
      .select()
      .single();

    if (inquiryError) {
      console.error('Error creating inquiry:', inquiryError);
      throw inquiryError;
    }

    console.log('Inquiry created successfully:', inquiry.id);

    // Trigger AI matching
    const { data: matchingResult, error: matchingError } = await supabase.functions.invoke(
      'ai-agent-matching',
      {
        body: { inquiryId: inquiry.id, conversationData }
      }
    );

    if (matchingError) {
      console.error('AI matching error (non-blocking):', matchingError);
    } else {
      console.log('AI matching completed:', matchingResult);
    }

    // Generate reference number for user
    const referenceNumber = `INQ-${inquiry.id.slice(0, 8).toUpperCase()}`;

    return new Response(
      JSON.stringify({ 
        success: true, 
        inquiryId: inquiry.id,
        referenceNumber: referenceNumber,
        message: "Your request has been received! A Goldsainte agent will contact you shortly.",
        contactEmail: travelerInfo.email,
        contactPhone: travelerInfo.phone,
        estimatedResponseTime: "2-4 hours",
        nextSteps: [
          "Our team is reviewing your request",
          `You'll be contacted at ${travelerInfo.phone}`,
          `Confirmation email sent to ${travelerInfo.email}`
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