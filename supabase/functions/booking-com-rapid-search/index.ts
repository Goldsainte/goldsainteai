import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { location, checkIn, checkOut, guests = 2, rooms = 1, max_total_price, currency = "USD" } = await req.json();
    
    console.log("=== BOOKING.COM RAPID API SEARCH ===");
    console.log("Params:", { location, checkIn, checkOut, guests, rooms, max_total_price, currency });

    if (!location || !checkIn || !checkOut) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters: location, checkIn, checkOut" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const rapidApiKey = Deno.env.get("BOOKING_COM_RAPID_API_KEY");
    if (!rapidApiKey) {
      throw new Error("Booking.com Rapid API key not configured");
    }

    // Step 1: Search for destination ID
    console.log(`🔍 Searching for destination: ${location}`);
    const searchResponse = await fetch(
      `https://booking-com15.p.rapidapi.com/api/v1/hotels/searchDestination?query=${encodeURIComponent(location)}`,
      {
        headers: {
          "X-RapidAPI-Key": rapidApiKey,
          "X-RapidAPI-Host": "booking-com15.p.rapidapi.com",
        },
      }
    );

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error("Destination search failed:", errorText);
      throw new Error(`Destination search failed: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    console.log("Search results:", JSON.stringify(searchData).substring(0, 500));

    const destination = searchData?.data?.[0];
    if (!destination) {
      console.warn("No destination found for:", location);
      return new Response(
        JSON.stringify({ hotels: [], message: `No destination found for "${location}"` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const destId = destination.dest_id;
    const destType = destination.dest_type || "city";
    console.log(`✅ Found destination: ${destination.name} (ID: ${destId}, Type: ${destType})`);

    // Step 2: Search for hotels
    console.log(`🏨 Searching hotels in destination ${destId}...`);
    const params = new URLSearchParams({
      dest_id: String(destId),
      search_type: destType,
      arrival_date: checkIn,
      departure_date: checkOut,
      adults: String(guests),
      room_qty: String(rooms),
      page_number: "1",
      units: "metric",
      temperature_unit: "c",
      languagecode: "en-us",
      currency_code: currency,
    });

    const hotelsResponse = await fetch(
      `https://booking-com15.p.rapidapi.com/api/v1/hotels/searchHotels?${params}`,
      {
        headers: {
          "X-RapidAPI-Key": rapidApiKey,
          "X-RapidAPI-Host": "booking-com15.p.rapidapi.com",
        },
      }
    );

    if (!hotelsResponse.ok) {
      const errorText = await hotelsResponse.text();
      console.error("Hotels search failed:", errorText);
      throw new Error(`Hotels search failed: ${hotelsResponse.status}`);
    }

    const hotelsData = await hotelsResponse.json();
    console.log("Hotels response structure:", Object.keys(hotelsData));

    const rawHotels = hotelsData?.data?.hotels || [];
    console.log(`📊 Raw hotels count: ${rawHotels.length}`);
    
    // Deep inspection of first result
    if (rawHotels.length > 0) {
      console.log("🔍 Sample hotel keys:", Object.keys(rawHotels[0] || {}));
      console.log("🔍 Sample property keys:", Object.keys(rawHotels[0]?.property || {}));
      console.log("🔍 Sample price fields:", {
        min_total_price: rawHotels[0]?.min_total_price,
        priceBreakdown: rawHotels[0]?.priceBreakdown,
        composite_price_breakdown: rawHotels[0]?.composite_price_breakdown
      });
      console.log("🔍 Sample photo fields:", {
        propertyPhotoUrls: rawHotels[0]?.property?.photoUrls,
        photoUrls: rawHotels[0]?.photoUrls,
        max_photo_url: rawHotels[0]?.max_photo_url,
        main_photo_url: rawHotels[0]?.main_photo_url,
        photoMainUrl: rawHotels[0]?.photoMainUrl
      });
    }

    if (rawHotels.length === 0) {
      return new Response(
        JSON.stringify({ hotels: [], message: "No hotels available for selected dates" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Transform to unified format
    const hotels = rawHotels
      .filter((hotel: any) => {
        // Filter by max price if specified
        if (max_total_price && hotel.min_total_price) {
          return hotel.min_total_price <= max_total_price;
        }
        return true;
      })
      .map((hotel: any) => {
        // Robust name fallback chain
        const name = hotel.property?.name ??
          hotel.hotel_name_trans ??
          hotel.hotel_name ??
          hotel.wishlistName ??
          hotel.name ??
          "Hotel";

        // Rating and reviews
        const rating = hotel.property?.reviewScore ?? hotel.reviewScore ?? 0;
        const reviewCount = hotel.property?.reviewCount ?? hotel.reviewCount ?? 0;

        // Collect photos from multiple known fields
        const photoStrings: string[] = []
          .concat(Array.isArray(hotel.property?.photoUrls) ? hotel.property.photoUrls : [])
          .concat(Array.isArray(hotel.photoUrls) ? hotel.photoUrls : [])
          .concat(hotel.max_photo_url ? [hotel.max_photo_url] : [])
          .concat(hotel.main_photo_url ? [hotel.main_photo_url] : [])
          .concat(hotel.photoMainUrl ? [hotel.photoMainUrl] : []);
        
        const uniquePhotos = [...new Set(photoStrings.filter(Boolean))];
        const allPhotos = uniquePhotos.map(url => ({ url, attribution: "Booking.com" }));
        const mainPhoto = uniquePhotos[0] || "";

        // Price and currency with resilient fallbacks
        const total = hotel.min_total_price ??
          hotel.priceBreakdown?.grossPrice?.value ??
          hotel.composite_price_breakdown?.gross_amount?.value ??
          hotel.composite_price_breakdown?.all_inclusive_amount?.value ??
          0;
        
        const curr = hotel.priceBreakdown?.grossPrice?.currency ??
          hotel.composite_price_breakdown?.gross_amount?.currency ??
          currency;

        // Clean address fallback
        const address = hotel.property?.address ??
          hotel.address ??
          hotel.cityName ??
          "";

        // Booking URL
        const bookingUrl = hotel.url || 
          hotel.property?.url || 
          (hotel.hotel_id ? `https://www.booking.com/hotel/${hotel.hotel_id}.html` : "");

        return {
          id: hotel.hotel_id,
          name,
          hotel: {
            hotelId: hotel.hotel_id,
            name,
            latitude: hotel.property?.latitude,
            longitude: hotel.property?.longitude,
            cityCode: destId,
          },
          rating,
          reviewCount,
          address,
          description: name,
          amenities: hotel.property?.amenities || [],
          photos: allPhotos,
          image_url: mainPhoto,
          offers: [
            {
              price: {
                total,
                currency: curr,
              },
              policies: {
                cancellation: hotel.property?.policies?.cancellation || "Check with hotel"
              },
              room: {
                type: "Room",
                description: name,
              },
            },
          ],
          __source: "booking.com",
          __bookingUrl: bookingUrl,
        };
      });

    console.log(`✅ Transformed ${hotels.length} hotels`);

    return new Response(
      JSON.stringify({ 
        hotels,
        destination: destination.name,
        totalResults: hotels.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Booking.com search error:", error);
    return new Response(
      JSON.stringify({ error: error.message, hotels: [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
