import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const EXPEDIA_API_KEY = Deno.env.get("EXPEDIA_API_KEY");
const EXPEDIA_API_SECRET = Deno.env.get("EXPEDIA_API_SECRET");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      propertyId,
      roomId,
      rateId,
      checkIn,
      checkOut,
      guestInfo,
      paymentToken, // Stripe payment token
      bookingReference,
      baseCost // Expedia's actual cost
    } = await req.json();

    console.log('Creating Expedia booking:', { 
      propertyId, 
      roomId, 
      checkIn, 
      checkOut,
      bookingReference 
    });

    if (!EXPEDIA_API_KEY || !EXPEDIA_API_SECRET) {
      throw new Error("EXPEDIA_API_KEY and EXPEDIA_API_SECRET must be configured");
    }

    // Create booking with Expedia Rapid API
    const bookingPayload = {
      affiliate_reference_id: bookingReference,
      hold: false, // Immediate booking
      email: guestInfo.email,
      phone: {
        country_code: "1",
        area_code: guestInfo.phone?.substring(0, 3) || "555",
        number: guestInfo.phone?.substring(3) || "0000000"
      },
      rooms: [
        {
          given_name: guestInfo.firstName,
          family_name: guestInfo.lastName,
          smoking: false,
          special_request: guestInfo.specialRequests || ""
        }
      ],
      payments: [
        {
          type: "customer_card",
          token: paymentToken
        }
      ]
    };

    console.log('Sending booking to Expedia:', JSON.stringify(bookingPayload));

    // Generate signature for Expedia Rapid API authentication
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const stringToSign = EXPEDIA_API_KEY + EXPEDIA_API_SECRET + timestamp;
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(EXPEDIA_API_SECRET);
    const messageData = encoder.encode(stringToSign);
    
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const signature = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const response = await fetch(
      `https://api.ean.com/v3/properties/${propertyId}/rooms/${roomId}/rates/${rateId}`,
      {
        method: "POST",
        headers: {
          "Authorization": `EAN apikey=${EXPEDIA_API_KEY},signature=${signature},timestamp=${timestamp}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(bookingPayload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Expedia booking error:', response.status, errorText);
      throw new Error(`Expedia booking failed: ${response.status} - ${errorText}`);
    }

    const bookingData = await response.json();
    console.log('Expedia booking created:', bookingData.itinerary_id);

    // Update booking in Supabase with Expedia confirmation
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Update booking with Expedia confirmation and base cost
    await supabaseClient
      .from('bookings')
      .update({
        status: 'confirmed',
        base_cost: baseCost,
        booking_data: {
          ...bookingData,
          expedia_itinerary_id: bookingData.itinerary_id,
          expedia_confirmation: bookingData.links?.retrieve
        }
      })
      .eq('booking_reference', bookingReference);

    return new Response(
      JSON.stringify({
        success: true,
        itineraryId: bookingData.itinerary_id,
        confirmationNumber: bookingData.itinerary_id,
        bookingData
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in expedia-book-hotel:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        success: false
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});