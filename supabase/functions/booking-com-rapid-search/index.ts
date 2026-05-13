import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
};
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const { location, checkIn, checkOut, guests = 2, rooms = 1, max_total_price, currency = "USD" } = await req.json();
    
    console.log("=== BOOKING.COM RAPID API SEARCH ===");
    console.log("Params:", { location, checkIn, checkOut, guests, rooms, max_total_price, currency });

    if (!location || !checkIn || !checkOut) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters: location, checkIn, checkOut" }),
        { headers: { ...corsHeaders(req), "Content-Type": "application/json" }, status: 400 }
      );
    }

    const rapidApiKey = Deno.env.get("BOOKING_COM_RAPID_API_KEY");
    if (!rapidApiKey) {
      throw new Error("Booking.com Rapid API key not configured");
    }

    // Known destination IDs for popular cities (fallback)
    const knownDestinations: Record<string, { dest_id: string; name: string; dest_type: string }> = {
      'miami': { dest_id: '-1982068', name: 'Miami, Florida', dest_type: 'city' },
      'new york': { dest_id: '-2601889', name: 'New York City', dest_type: 'city' },
      'los angeles': { dest_id: '-1236594', name: 'Los Angeles, California', dest_type: 'city' },
      'chicago': { dest_id: '-2092174', name: 'Chicago, Illinois', dest_type: 'city' },
      'las vegas': { dest_id: '-1975964', name: 'Las Vegas, Nevada', dest_type: 'city' },
      'orlando': { dest_id: '-1982068', name: 'Orlando, Florida', dest_type: 'city' },
      'san francisco': { dest_id: '-1989021', name: 'San Francisco, California', dest_type: 'city' },
      'seattle': { dest_id: '-1982419', name: 'Seattle, Washington', dest_type: 'city' },
      'boston': { dest_id: '-2039060', name: 'Boston, Massachusetts', dest_type: 'city' },
      'atlanta': { dest_id: '-2047963', name: 'Atlanta, Georgia', dest_type: 'city' },
      'london': { dest_id: '-2601889', name: 'London, UK', dest_type: 'city' },
      'paris': { dest_id: '-1456928', name: 'Paris, France', dest_type: 'city' },
      'tokyo': { dest_id: '-246227', name: 'Tokyo, Japan', dest_type: 'city' },
      'dubai': { dest_id: '-782831', name: 'Dubai, UAE', dest_type: 'city' },
      'barcelona': { dest_id: '-372490', name: 'Barcelona, Spain', dest_type: 'city' },
      'rome': { dest_id: '-126693', name: 'Rome, Italy', dest_type: 'city' },
    };

    // Step 1: Search for destination ID with multiple query variations
    console.log(`🔍 Searching for destination: ${location}`);
    
    const locationKey = location.toLowerCase().trim();
    let destination = null;

    // Try location query variations
    const queryVariations = [
      location,
      `${location}, United States`,
      `${location}, USA`,
      location.replace(/,.*$/, '').trim(), // Just city name without state/country
    ];

    for (const query of queryVariations) {
      console.log(`📍 Trying search query: "${query}"`);
      
      try {
        const searchResponse = await fetch(
          `https://booking-com15.p.rapidapi.com/api/v1/hotels/searchDestination?query=${encodeURIComponent(query)}`,
          {
            headers: {
              "X-RapidAPI-Key": rapidApiKey,
              "X-RapidAPI-Host": "booking-com15.p.rapidapi.com",
            },
          }
        );

        if (!searchResponse.ok) {
          console.warn(`⚠️ Query "${query}" failed with status ${searchResponse.status}`);
          continue;
        }

        const searchData = await searchResponse.json();
        console.log(`📊 Response for "${query}":`, JSON.stringify(searchData).substring(0, 300));

        // Check if API returned error message instead of data
        if (searchData.status === false || searchData.message?.includes('Server down')) {
          console.warn(`⚠️ API error for "${query}": ${searchData.message}`);
          continue;
        }

        if (searchData?.data?.length > 0) {
          destination = searchData.data[0];
          console.log(`✅ Found destination with query "${query}": ${destination.name} (ID: ${destination.dest_id})`);
          break;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn(`⚠️ Error trying query "${query}":`, errorMessage);
        continue;
      }
    }

    // Fallback to known destinations
    if (!destination && knownDestinations[locationKey]) {
      console.log(`💡 Using known destination ID for "${locationKey}"`);
      destination = knownDestinations[locationKey];
    }

    if (!destination) {
      console.error(`❌ No destination found for "${location}" after all attempts`);
      return new Response(
        JSON.stringify({ 
          hotels: [], 
          message: `No destination found for "${location}". Please try a different location or be more specific (e.g., "Miami, FL")` 
        }),
        { headers: { ...corsHeaders(req), "Content-Type": "application/json" }, status: 200 }
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
        { headers: { ...corsHeaders(req), "Content-Type": "application/json" }, status: 200 }
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
        const photoStrings: string[] = ([] as string[])
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
      { headers: { ...corsHeaders(req), "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Booking.com search error:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage, hotels: [] }),
      { headers: { ...corsHeaders(req), "Content-Type": "application/json" }, status: 500 }
    );
  }
});
