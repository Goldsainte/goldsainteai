import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { 
import { resolveAllowedOrigin } from "../_shared/cors.ts";
  sanitizeText, 
  validateNumber, 
  validateStringLength,
  validateRequestBody 
} from "../_shared/inputValidation.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-csrf-token',
  "Vary": "Origin",
};
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const payload = await req.json();
    
    // SECURITY: Validate required fields
    const { valid, errors } = validateRequestBody(payload, ['tripType']);
    if (!valid) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields', details: errors }), 
        { status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const { tripType, hotelRequest, flightRequest, lead } = payload;

    // SECURITY: Validate tripType
    const validTripTypes = ['hotel', 'flight', 'package'];
    if (!validTripTypes.includes(tripType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid trip type' }), 
        { status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Sanitize and validate destination
    let destination = 'TBD';
    if (hotelRequest?.destination) {
      destination = sanitizeText(hotelRequest.destination);
      const destValidation = validateStringLength(destination, 1, 200);
      if (!destValidation.valid) {
        return new Response(
          JSON.stringify({ error: 'Destination must be 1-200 characters' }), 
          { status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
        );
      }
    } else if (flightRequest?.destination) {
      destination = sanitizeText(flightRequest.destination);
    }

    // SECURITY: Validate budget values
    const budgetValue = hotelRequest?.budgetPerNight || flightRequest?.budgetTotal || 0;
    const budgetValidation = validateNumber(budgetValue, 0, 1000000);
    if (!budgetValidation.valid) {
      return new Response(
        JSON.stringify({ error: budgetValidation.error }), 
        { status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Sanitize currency (3-letter code)
    let currency = 'USD';
    if (hotelRequest?.currency || flightRequest?.currency) {
      const rawCurrency = (hotelRequest?.currency || flightRequest?.currency || 'USD').toUpperCase();
      if (/^[A-Z]{3}$/.test(rawCurrency)) {
        currency = rawCurrency;
      }
    }

    console.log('Creating marketplace lead:', { userId: user.id, tripType });

    // SECURITY: Sanitize description to prevent XSS
    const hotelDesc = hotelRequest ? sanitizeText(JSON.stringify(hotelRequest, null, 2)).substring(0, 5000) : 'N/A';
    const flightDesc = flightRequest ? sanitizeText(JSON.stringify(flightRequest, null, 2)).substring(0, 5000) : 'N/A';

    // Create marketplace job
    const { data: job, error: jobError } = await supabaseClient
      .from('marketplace_jobs')
      .insert({
        user_id: user.id,
        title: `${tripType} Booking Request`,
        description: `Trip type: ${tripType}\n\nHotel: ${hotelDesc}\n\nFlight: ${flightDesc}`,
        booking_type: tripType === 'hotel' ? 'hotel' : tripType === 'flight' ? 'flight' : 'package',
        destination: destination,
        budget_min: budgetValidation.value,
        budget_max: budgetValidation.value! * 1.5,
        currency: currency,
        status: 'open',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (jobError) {
      console.error('Error creating job:', jobError);
      throw jobError;
    }

    // Log activity
    await supabaseClient.from('activity_logs').insert({
      user_id: user.id,
      action: 'marketplace_lead_created',
      entity_type: 'marketplace_job',
      entity_id: job.id,
      details: { source: 'ai_chat', tripType },
    });

    console.log('✅ Marketplace lead created:', job.id);

    return new Response(
      JSON.stringify({
        success: true,
        leadId: job.id,
        caseId: `MKT-${job.id.slice(0, 8).toUpperCase()}`,
        message: 'Your request has been submitted to our Goldsainte Certified Travel Agents. You should receive responses within 24 hours.',
      }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create-marketplace-lead:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
