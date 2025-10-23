import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const bookingSchema = z.object({
  bookingType: z.enum(['hotel', 'flight', 'car', 'package', 'restaurant', 'event']),
  bookingData: z.record(z.unknown()),
  totalPrice: z.number().positive().max(1000000),
  currency: z.string().length(3),
  source: z.enum(['homepage_featured', 'ai_search', 'manual_search', 'ai_concierge']).optional(),
  guestInfo: z.object({
    email: z.string().email().max(255),
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    phone: z.string().trim().max(20).optional(),
    country: z.string().max(100).optional(),
    specialRequests: z.string().max(1000).optional(),
  }),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate input
    const validationResult = bookingSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error);
      return new Response(JSON.stringify({ 
        error: 'Invalid input data',
        details: validationResult.error.issues 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    
    const { bookingType, bookingData, totalPrice, currency, source, guestInfo } = validationResult.data;
    
    console.log('Creating booking:', { bookingType, totalPrice, currency, source });

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Try to get authenticated user from token
    let userId = null;
    try {
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabaseClient.auth.getUser(token);
        userId = user?.id || null;
        console.log('Authenticated user:', userId);
      }
    } catch (error) {
      console.log('No authenticated user, proceeding as guest checkout');
    }

    // Create guest record
    const { data: guest, error: guestError } = await supabaseClient
      .from('guests')
      .insert({
        email: guestInfo.email,
        first_name: guestInfo.firstName,
        last_name: guestInfo.lastName,
        phone: guestInfo.phone,
        country: guestInfo.country
      })
      .select()
      .single();

    if (guestError) {
      console.error('Guest creation error:', guestError);
      throw new Error('Failed to create guest record');
    }

    console.log('Guest created:', guest.id);

    // Generate booking reference
    const bookingReference = `GS${Date.now().toString().slice(-8)}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Create booking record
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .insert({
        booking_type: bookingType,
        booking_reference: bookingReference,
        status: 'pending',
        total_price: totalPrice,
        currency: currency,
        booking_data: {
          ...bookingData,
          source: source || 'manual_search' // Track booking source for commission analytics
        },
        guest_id: guest.id,
        user_id: userId // Link to authenticated user if available
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Booking creation error:', bookingError);
      throw new Error('Failed to create booking record');
    }

    console.log('Booking created:', booking.id, 'Reference:', bookingReference);

    // Send confirmation email in the background
    const emailData = {
      guestEmail: guestInfo.email,
      guestName: `${guestInfo.firstName} ${guestInfo.lastName}`,
      bookingReference,
      bookingType,
      bookingData,
      checkInDate: bookingData.checkInDate,
      checkOutDate: bookingData.checkOutDate,
      totalPrice,
      currency,
      specialRequests: guestInfo.specialRequests
    };

    // Send email without blocking the response
    fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-confirmation-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
      },
      body: JSON.stringify(emailData)
    }).catch(error => console.error('Failed to send confirmation email:', error));

    return new Response(JSON.stringify({ 
      booking,
      bookingReference
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in create-booking:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});