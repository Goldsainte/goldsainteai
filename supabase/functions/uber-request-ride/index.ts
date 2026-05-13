import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  "Vary": "Origin",
};
}

interface RideRequest {
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffLatitude: number;
  dropoffLongitude: number;
  pickupAddress?: string;
  dropoffAddress?: string;
  productId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const rideRequest: RideRequest = await req.json();
    console.log('Processing Uber ride request:', rideRequest);

    // Step 1: Get Uber access token using OAuth2
    const clientId = Deno.env.get('UBER_CLIENT_ID');
    const clientSecret = Deno.env.get('UBER_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('Uber credentials not configured');
    }

    // Get OAuth token
    const tokenResponse = await fetch('https://login.uber.com/oauth/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
        scope: 'rides.request',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Uber OAuth error:', error);
      throw new Error('Failed to authenticate with Uber');
    }

    const { access_token } = await tokenResponse.json();

    // Step 2: Request fare estimate
    const fareEstimateResponse = await fetch(
      `https://api.uber.com/v1.2/estimates/price?start_latitude=${rideRequest.pickupLatitude}&start_longitude=${rideRequest.pickupLongitude}&end_latitude=${rideRequest.dropoffLatitude}&end_longitude=${rideRequest.dropoffLongitude}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!fareEstimateResponse.ok) {
      const error = await fareEstimateResponse.text();
      console.error('Uber fare estimate error:', error);
      throw new Error('Failed to get fare estimate');
    }

    const fareData = await fareEstimateResponse.json();
    const selectedProduct = fareData.prices.find((p: any) => p.product_id === rideRequest.productId);

    // Step 3: Request ride
    const rideResponse = await fetch('https://api.uber.com/v1.2/requests', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: rideRequest.productId,
        start_latitude: rideRequest.pickupLatitude,
        start_longitude: rideRequest.pickupLongitude,
        end_latitude: rideRequest.dropoffLatitude,
        end_longitude: rideRequest.dropoffLongitude,
      }),
    });

    if (!rideResponse.ok) {
      const error = await rideResponse.text();
      console.error('Uber ride request error:', error);
      throw new Error('Failed to request ride');
    }

    const rideData = await rideResponse.json();

    // Step 4: Store in database
    const { data: dbRecord, error: dbError } = await supabaseClient
      .from('uber_ride_requests')
      .insert({
        user_id: user.id,
        pickup_latitude: rideRequest.pickupLatitude,
        pickup_longitude: rideRequest.pickupLongitude,
        dropoff_latitude: rideRequest.dropoffLatitude,
        dropoff_longitude: rideRequest.dropoffLongitude,
        pickup_address: rideRequest.pickupAddress,
        dropoff_address: rideRequest.dropoffAddress,
        product_id: rideRequest.productId,
        ride_id: rideData.request_id,
        status: rideData.status,
        estimated_price: selectedProduct?.estimate ? parseFloat(selectedProduct.estimate.split('-')[0].replace(/[^0-9.]/g, '')) : null,
        currency: selectedProduct?.currency_code || 'USD',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to store ride request');
    }

    console.log('Ride request successful:', dbRecord);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...dbRecord,
          uber_data: rideData,
        },
      }),
      {
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    console.error('Error processing Uber ride request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 400,
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      }
    );
  }
});