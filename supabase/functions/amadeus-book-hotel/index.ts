import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Get Amadeus access token
async function getAmadeusToken() {
  const apiKey = Deno.env.get('AMADEUS_API_KEY');
  const apiSecret = Deno.env.get('AMADEUS_API_SECRET');
  
  if (!apiKey || !apiSecret) {
    throw new Error('Amadeus credentials not configured');
  }

  const response = await fetch('https://api.amadeus.com/v1/security/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `grant_type=client_credentials&client_id=${apiKey}&client_secret=${apiSecret}`
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Amadeus auth error:', error);
    throw new Error('Failed to authenticate with Amadeus');
  }

  const data = await response.json();
  return data.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      offerId,
      hotelId,
      guestInfo,
      bookingReference,
      baseCost // Amadeus net rate
    } = await req.json();

    console.log('Creating Amadeus booking:', { 
      offerId, 
      hotelId,
      bookingReference 
    });

    const token = await getAmadeusToken();

    // Create booking with Amadeus Hotel Booking API v2
    const bookingPayload = {
      data: {
        offerId: offerId,
        guests: [
          {
            tid: 1,
            title: guestInfo.title || "MR",
            firstName: guestInfo.firstName,
            lastName: guestInfo.lastName,
            phone: guestInfo.phone || "+10000000000",
            email: guestInfo.email
          }
        ],
        payments: [
          {
            method: "CREDIT_CARD",
            card: {
              vendorCode: "VI", // Will be replaced with actual payment integration
              cardNumber: "4111111111111111",
              expiryDate: "2025-12"
            }
          }
        ]
      }
    };

    console.log('Sending booking to Amadeus:', JSON.stringify(bookingPayload));

    const response = await fetch(
      "https://api.amadeus.com/v2/booking/hotel-bookings",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingPayload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Amadeus booking error:', response.status, errorText);
      throw new Error(`Amadeus booking failed: ${response.status} - ${errorText}`);
    }

    const bookingData = await response.json();
    console.log('Amadeus booking created:', bookingData.data?.id);

    // Update booking in Supabase with Amadeus confirmation
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Markup already applied in search - use baseCost as-is
    // baseCost should be the original Amadeus price without markup
    const markupPercentage = 15;
    const markupAmount = baseCost * (markupPercentage / 100);
    const totalPrice = baseCost + markupAmount;

    // Update booking with Amadeus confirmation and pricing breakdown
    await supabaseClient
      .from('bookings')
      .update({
        status: 'confirmed',
        base_cost: baseCost, // Original Amadeus price
        markup_percentage: markupPercentage,
        markup_amount: markupAmount,
        total_price: totalPrice, // Price shown to customer
        booking_data: {
          ...bookingData.data,
          amadeus_booking_id: bookingData.data?.id,
          amadeus_provider_confirmation: bookingData.data?.providerConfirmationId
        }
      })
      .eq('booking_reference', bookingReference);

    return new Response(
      JSON.stringify({
        success: true,
        bookingId: bookingData.data?.id,
        confirmationNumber: bookingData.data?.providerConfirmationId,
        bookingData: bookingData.data
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in amadeus-book-hotel:", error);
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
