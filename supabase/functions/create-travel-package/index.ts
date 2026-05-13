import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://goldsainte.ai',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      destination, 
      departureDate, 
      returnDate, 
      travelers = 1,
      selectedFlight, 
      selectedHotel, 
      selectedCar,
      bundleDiscount = 7 // Default 7% discount
    } = await req.json();

    // Validate required fields
    if (!destination || !departureDate || !returnDate) {
      throw new Error('Missing required fields: destination, departureDate, returnDate');
    }

    // Calculate prices
    const flightPrice = selectedFlight?.price ? parseFloat(selectedFlight.price) : 0;
    const hotelPrice = selectedHotel?.price ? parseFloat(selectedHotel.price) : 0;
    const carPrice = selectedCar?.price ? parseFloat(selectedCar.price) : 0;

    const totalPrice = flightPrice + hotelPrice + carPrice;
    const bundledPrice = totalPrice * (1 - bundleDiscount / 100);
    const savingsAmount = totalPrice - bundledPrice;

    console.log('Package calculation:', {
      flightPrice,
      hotelPrice,
      carPrice,
      totalPrice,
      bundledPrice,
      savingsAmount
    });

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    );

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Store package in database
    const { data: packageData, error: packageError } = await supabaseClient
      .from('ai_bundled_packages')
      .insert({
        user_id: user.id,
        destination,
        departure_date: departureDate,
        return_date: returnDate,
        travelers_count: travelers,
        flight_details: selectedFlight || null,
        hotel_details: selectedHotel || null,
        car_details: selectedCar || null,
        total_price: totalPrice.toFixed(2),
        bundled_price: bundledPrice.toFixed(2),
        savings_amount: savingsAmount.toFixed(2),
        currency: 'USD',
        status: 'draft'
      })
      .select()
      .single();

    if (packageError) {
      console.error('Error creating package:', packageError);
      throw new Error(`Failed to create package: ${packageError.message}`);
    }

    return new Response(JSON.stringify({
      success: true,
      package: packageData,
      pricing: {
        totalPrice: totalPrice.toFixed(2),
        bundledPrice: bundledPrice.toFixed(2),
        savings: savingsAmount.toFixed(2),
        discountPercentage: bundleDiscount
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in create-travel-package:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
