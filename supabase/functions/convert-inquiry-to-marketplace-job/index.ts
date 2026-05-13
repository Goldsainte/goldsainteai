import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://goldsainte.ai',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { inquiryId } = await req.json();

    console.log('Converting inquiry to marketplace job:', inquiryId);

    // Fetch the inquiry with all details
    const { data: inquiry, error: inquiryError } = await supabaseClient
      .from('agent_inquiries')
      .select('*')
      .eq('id', inquiryId)
      .single();

    if (inquiryError || !inquiry) {
      throw new Error('Inquiry not found');
    }

    // Parse travel details from conversation data
    const travelDetails = inquiry.conversation_data?.travelDetails || {};
    const travelerInfo = inquiry.conversation_data?.travelerInfo || {};
    
    // Extract key information
    const serviceType = travelDetails.serviceType || 'general_inquiry';
    const destination = travelDetails.destination || 'Not specified';
    const origin = travelDetails.origin || '';
    const departureDate = travelDetails.departureDate;
    const returnDate = travelDetails.returnDate;
    const conversationSummary = travelDetails.conversationSummary || '';
    const specialRequests = travelDetails.specialRequests || '';
    const travelers = travelDetails.travelers || { adults: 1 };
    const budget = travelDetails.budget || {};
    
    // Generate title
    const titleParts = [];
    if (serviceType !== 'general_inquiry') {
      titleParts.push(serviceType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()));
    }
    if (destination !== 'Not specified') {
      titleParts.push(`to ${destination}`);
    }
    if (origin) {
      titleParts.push(`from ${origin}`);
    }
    const title = titleParts.join(' ') || `Travel Request from ${inquiry.guest_name}`;

    // Generate description
    const descriptionParts = [];
    descriptionParts.push(`**Traveler:** ${inquiry.guest_name}`);
    descriptionParts.push(`**Contact:** ${inquiry.guest_email} | ${inquiry.guest_phone || 'Not provided'}`);
    if (conversationSummary) {
      descriptionParts.push(`\n**Request Summary:**\n${conversationSummary}`);
    }
    if (travelers.adults || travelers.children || travelers.infants) {
      const travelerCount = `${travelers.adults || 0} adult(s)${travelers.children ? `, ${travelers.children} child(ren)` : ''}${travelers.infants ? `, ${travelers.infants} infant(s)` : ''}`;
      descriptionParts.push(`\n**Travelers:** ${travelerCount}`);
    }
    if (departureDate) {
      descriptionParts.push(`**Departure Date:** ${departureDate}`);
    }
    if (returnDate) {
      descriptionParts.push(`**Return Date:** ${returnDate}`);
    }
    if (specialRequests) {
      descriptionParts.push(`\n**Special Requests:**\n${specialRequests}`);
    }
    
    const description = descriptionParts.join('\n');

    // Determine booking type
    const bookingTypeMap: Record<string, string> = {
      'flight': 'flight',
      'hotel': 'hotel',
      'car_rental': 'car',
      'uber': 'transfer',
      'package': 'package',
      'visa_assistance': 'visa',
      'general_inquiry': 'package'
    };
    const bookingType = bookingTypeMap[serviceType] || 'package';

    // Extract budget
    const budgetMin = budget.amount ? Math.round(budget.amount * 0.8) : null;
    const budgetMax = budget.amount || null;
    const currency = budget.currency || 'USD';

    // Create marketplace job
    const { data: job, error: jobError } = await supabaseClient
      .from('marketplace_jobs')
      .insert({
        user_id: inquiry.user_id || null,
        title,
        description,
        booking_type: bookingType,
        destination,
        status: 'open',
        budget_min: budgetMin,
        budget_max: budgetMax,
        currency,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        requirements: {
          serviceType,
          origin,
          destination,
          departureDate,
          returnDate,
          travelers,
          specialRequests,
          urgency: travelDetails.urgency || 'flexible'
        },
        inquiry_source: 'ai_chat',
        contact_info: {
          name: inquiry.guest_name,
          email: inquiry.guest_email,
          phone: inquiry.guest_phone
        }
      })
      .select()
      .single();

    if (jobError) {
      console.error('Error creating marketplace job:', jobError);
      throw jobError;
    }

    console.log('Marketplace job created:', job.id);

    // Update inquiry with marketplace job reference
    await supabaseClient
      .from('agent_inquiries')
      .update({ 
        marketplace_job_id: job.id,
        status: 'converted'
      })
      .eq('id', inquiryId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        jobId: job.id,
        jobTitle: title,
        jobUrl: `/marketplace?job=${job.id}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error in convert-inquiry-to-marketplace-job:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
