import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://goldsainte.ai',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const visaRequestSchema = z.object({
  userEmail: z.string().email().max(255),
  userName: z.string().trim().max(200).optional(),
  userPhone: z.string().trim().max(50).optional(),
  fromCountry: z.string().trim().min(1).max(100),
  toCountry: z.string().trim().min(1).max(100),
  visaInformation: z.record(z.unknown()).optional(),
  travelDates: z.record(z.unknown()).optional(),
  additionalNotes: z.string().max(2000).optional(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate input
    const validationResult = visaRequestSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input data',
          details: validationResult.error.issues 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }
    
    const { 
      userEmail, 
      userName, 
      userPhone, 
      fromCountry, 
      toCountry, 
      visaInformation,
      travelDates,
      additionalNotes 
    } = validationResult.data;

    console.log('Visa service request:', { userEmail, fromCountry, toCountry });

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
