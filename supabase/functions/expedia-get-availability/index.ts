import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const EXPEDIA_API_KEY = Deno.env.get("EXPEDIA_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { propertyId, checkIn, checkOut, guests = 2 } = await req.json();
    
    console.log('Checking Expedia availability:', { propertyId, checkIn, checkOut, guests });

    if (!EXPEDIA_API_KEY) {
      throw new Error("EXPEDIA_API_KEY is not configured");
    }

    // Get detailed property availability and pricing
    const url = new URL(`https://api.ean.com/v3/properties/${propertyId}/availability`);
    url.searchParams.append("checkin", checkIn);
    url.searchParams.append("checkout", checkOut);
    url.searchParams.append("occupancy", `${guests}`);
    url.searchParams.append("sales_channel", "website");
    url.searchParams.append("sales_environment", "hotel_only");

    console.log('Calling Expedia availability API:', url.toString());

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${EXPEDIA_API_KEY}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Expedia availability error:', response.status, errorText);
      throw new Error(`Expedia API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Expedia availability response received');

    // Transform room data
    const rooms = (data.rooms || []).map((room: any) => ({
      id: room.id,
      name: room.name,
      description: room.descriptions?.overview || '',
      bedType: room.bed_groups?.[0]?.description || 'Standard',
      capacity: room.occupancy?.max_allowed?.total || guests,
      amenities: room.amenities?.map((a: any) => a.name) || [],
      images: room.images?.map((img: any) => img.links?.['1000px']?.href) || [],
      rates: (room.rates || []).map((rate: any) => ({
        id: rate.id,
        price: rate.totals?.inclusive?.billable_currency?.value || 0,
        currency: rate.totals?.inclusive?.billable_currency?.code || 'USD',
        cancellable: rate.cancel_penalties?.length === 0,
        refundable: rate.refundable,
        merchantOfRecord: rate.merchant_of_record,
        available: rate.available_rooms > 0,
        availableRooms: rate.available_rooms
      }))
    }));

    console.log(`Found ${rooms.length} available rooms`);

    return new Response(
      JSON.stringify({
        available: rooms.length > 0,
        rooms,
        propertyInfo: {
          id: propertyId,
          name: data.property_name,
          checkIn: data.checkin,
          checkOut: data.checkout
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in expedia-get-availability:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        available: false,
        rooms: []
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});