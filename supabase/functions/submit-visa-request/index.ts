import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
      userEmail, 
      userName, 
      userPhone, 
      fromCountry, 
      toCountry, 
      visaInformation,
      travelDates,
      additionalNotes 
    } = await req.json();

    console.log('Visa service request:', { userEmail, fromCountry, toCountry });

    // Validate required fields
    if (!userEmail || !fromCountry || !toCountry) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userEmail, fromCountry, toCountry' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Insert visa service request
    const { data, error } = await supabase
      .from('visa_service_requests')
      .insert({
        user_email: userEmail,
        user_name: userName,
        user_phone: userPhone,
        from_country: fromCountry,
        to_country: toCountry,
        visa_information: visaInformation || {},
        travel_dates: travelDates || {},
        additional_notes: additionalNotes,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log('Visa service request created:', data.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        requestId: data.id,
        message: 'Visa service request submitted successfully. Our team will contact you within 24 hours.'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in submit-visa-request:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
