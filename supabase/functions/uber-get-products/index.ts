import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  "Vary": "Origin",
};
}

interface ProductRequest {
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffLatitude: number;
  dropoffLongitude: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const requestData: ProductRequest = await req.json();
    const { pickupLatitude, pickupLongitude, dropoffLatitude, dropoffLongitude } = requestData;
    
    // Validate coordinates
    if (!pickupLatitude || !pickupLongitude || !dropoffLatitude || !dropoffLongitude) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Missing required coordinates'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }
        }
      );
    }

    // Get Uber credentials from secrets
    const UBER_CLIENT_ID = Deno.env.get('UBER_CLIENT_ID');
    const UBER_CLIENT_SECRET = Deno.env.get('UBER_CLIENT_SECRET');

    if (!UBER_CLIENT_ID || !UBER_CLIENT_SECRET) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Uber service temporarily unavailable. Please try again later.'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }
        }
      );
    }

    // Get OAuth2 access token
    const tokenResponse = await fetch('https://auth.uber.com/oauth/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: UBER_CLIENT_ID,
        client_secret: UBER_CLIENT_SECRET,
        grant_type: 'client_credentials',
        scope: 'rides.request',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Uber token error:', errorText);
      throw new Error('Failed to get Uber access token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get available products
    const productsResponse = await fetch(
      `https://api.uber.com/v1.2/products?latitude=${pickupLatitude}&longitude=${pickupLongitude}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept-Language': 'en_US',
          'Content-Type': 'application/json',
        },
      }
    );

    if (!productsResponse.ok) {
      const errorText = await productsResponse.text();
      console.error('Uber products error:', errorText);
      throw new Error('Failed to fetch Uber products');
    }

    const productsData = await productsResponse.json();

    // Get price estimates for each product
    const estimatesResponse = await fetch(
      `https://api.uber.com/v1.2/estimates/price?start_latitude=${pickupLatitude}&start_longitude=${pickupLongitude}&end_latitude=${dropoffLatitude}&end_longitude=${dropoffLongitude}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept-Language': 'en_US',
          'Content-Type': 'application/json',
        },
      }
    );

    let priceEstimates = [];
    if (estimatesResponse.ok) {
      const estimatesData = await estimatesResponse.json();
      priceEstimates = estimatesData.prices || [];
    }

    // Combine products with price estimates
    const enrichedProducts = productsData.products.map((product: any) => {
      const priceInfo = priceEstimates.find((p: any) => p.product_id === product.product_id);
      
      return {
        product_id: product.product_id,
        display_name: product.display_name,
        description: product.description,
        capacity: product.capacity,
        image_url: product.image,
        price_estimate: priceInfo ? {
          low: Math.round(priceInfo.low_estimate),
          high: Math.round(priceInfo.high_estimate),
          currency: priceInfo.currency_code,
          surge_multiplier: priceInfo.surge_multiplier || 1,
          duration_minutes: Math.round((priceInfo.duration || 0) / 60),
          distance_miles: priceInfo.distance || 0,
        } : null,
      };
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        products: enrichedProducts,
      }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in uber-get-products:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Unknown error occurred'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }
      }
    );
  }
});
