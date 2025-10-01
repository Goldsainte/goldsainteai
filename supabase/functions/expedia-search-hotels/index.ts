import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
    const { location, checkIn, checkOut, guests = 2, rooms = 1 } = await req.json();
    
    console.log('Expedia hotel search:', { location, checkIn, checkOut, guests, rooms });

    if (!EXPEDIA_API_KEY || !EXPEDIA_API_SECRET) {
      throw new Error("EXPEDIA_API_KEY and EXPEDIA_API_SECRET must be configured");
    }

    // Expedia Rapid API endpoint for property availability
    const url = new URL("https://api.ean.com/v3/properties/availability");
    url.searchParams.append("location", location);
    url.searchParams.append("checkin", checkIn);
    url.searchParams.append("checkout", checkOut);
    url.searchParams.append("occupancy", `${guests}`);
    url.searchParams.append("sales_channel", "website");
    url.searchParams.append("sales_environment", "hotel_only");
    url.searchParams.append("include", "property_ids,room_types,rates");

    console.log('Calling Expedia API:', url.toString());

    // Generate signature for Expedia Rapid API authentication
    const timestamp = Math.floor(Date.now() / 1000).toString();
    
    // Create the string to sign: apikey + secret + timestamp
    const stringToSign = EXPEDIA_API_KEY + EXPEDIA_API_SECRET + timestamp;
    
    // Generate HMAC-SHA256 signature
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

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Authorization": `EAN apikey=${EXPEDIA_API_KEY},signature=${signature},timestamp=${timestamp}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Expedia API error:', response.status, errorText);
      throw new Error(`Expedia API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Expedia response:', JSON.stringify(data).substring(0, 500));

    // Apply 15% markup to all prices
    const MARKUP_PERCENTAGE = 15;
    
    // Transform Expedia response to match our format with markup
    const hotels = (data.properties || []).map((property: any) => {
      const basePrice = property.rooms?.[0]?.rates?.[0]?.totals?.inclusive?.billable_currency?.value || 0;
      const markedUpPrice = basePrice * (1 + MARKUP_PERCENTAGE / 100);
      
      return {
        id: property.property_id,
        name: property.name,
        address: property.address?.line_1 || '',
        city: property.address?.city || '',
        rating: property.star_rating || 0,
        reviewScore: property.guest_rating?.overall || 0,
        reviewCount: property.guest_rating?.count || 0,
        price: markedUpPrice, // Display marked up price to customer
        basePrice: basePrice, // Store original Expedia price
        markupPercentage: MARKUP_PERCENTAGE,
        currency: property.rooms?.[0]?.rates?.[0]?.totals?.inclusive?.billable_currency?.code || 'USD',
        image: property.images?.[0]?.links?.['1000px']?.href || null,
        amenities: property.amenities?.map((a: any) => a.name) || [],
        rooms: property.rooms || [],
        expediaData: property // Store full Expedia data for booking
      };
    });

    console.log(`Found ${hotels.length} hotels from Expedia`);

    return new Response(JSON.stringify({ hotels }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in expedia-search-hotels:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        hotels: []
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});