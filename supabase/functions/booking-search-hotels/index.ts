import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { location, checkIn, checkOut, adults = 2, max_total_price, currency = 'USD' } = await req.json();
    
    console.log('Booking.com hotel search request:', { location, checkIn, checkOut, adults });

    const apiKey = Deno.env.get('BOOKING_API_KEY');
    if (!apiKey) {
      throw new Error('BOOKING_API_KEY not configured');
    }

    // Resolve Booking.com destination ID from the provided location (city name or numeric dest_id)
    let destId = '';
    if (typeof location === 'string' && /^\d+$/.test(location.trim())) {
      destId = location.trim();
      console.log('Using provided numeric dest_id for Booking.com:', destId);
    } else {
      const destUrl = new URL('https://booking-com15.p.rapidapi.com/api/v1/hotels/searchDestination');
      destUrl.searchParams.append('query', String(location || ''));
      try {
        const destRes = await fetch(destUrl.toString(), {
          method: 'GET',
          headers: {
            'x-rapidapi-key': apiKey,
            'x-rapidapi-host': 'booking-com15.p.rapidapi.com'
          },
          signal: AbortSignal.timeout(10000)
        });
        if (destRes.ok) {
          const destData = await destRes.json();
          const items = destData?.data || destData?.result || [];
          const cityMatch = items.find((i: any) => (i.dest_type || i.search_type || '').toString().toLowerCase().includes('city')) || items[0];
          destId = cityMatch?.dest_id || cityMatch?.destId || '';
          console.log('Resolved Booking.com dest_id:', destId, 'for location:', location);
        } else {
          console.warn('Destination lookup failed with status', destRes.status);
        }
      } catch (e) {
        console.warn('Destination lookup error:', e);
      }
    }

    if (!destId) {
      console.warn('No Booking.com dest_id could be resolved for location:', location);
    }

    // Search for hotels using Booking.com API
    const searchUrl = new URL('https://booking-com15.p.rapidapi.com/api/v1/hotels/searchHotels');
    searchUrl.searchParams.append('dest_id', destId || String(location || ''));
    searchUrl.searchParams.append('search_type', 'CITY');
    searchUrl.searchParams.append('arrival_date', checkIn);
    searchUrl.searchParams.append('departure_date', checkOut);
    searchUrl.searchParams.append('adults', adults.toString());
    searchUrl.searchParams.append('room_qty', '1');
    searchUrl.searchParams.append('units', 'metric');
    searchUrl.searchParams.append('temperature_unit', 'c');
    searchUrl.searchParams.append('languagecode', 'en-us');
    searchUrl.searchParams.append('currency_code', currency);

    console.log('Fetching hotels from Booking.com...');
    const searchResponse = await fetch(searchUrl.toString(), {
      method: 'GET',
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'booking-com15.p.rapidapi.com'
      },
      signal: AbortSignal.timeout(15000) // 15s timeout
    });

    if (!searchResponse.ok) {
      console.error(`Booking.com search failed: ${searchResponse.status}`);
      throw new Error(`Booking.com search failed: ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();
    const hotels = searchData.data?.hotels || searchData.data?.result || [];
    
    console.log(`Booking.com returned ${hotels.length} hotels`);

    // Calculate nights for price per night calculation
    const nights = Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)));
    
    // Transform Booking.com results to consistent format with 15% markup
    const transformedHotels = hotels
      .filter((hotel: any) => {
        // Filter out test/demo hotels
        const name = (hotel.property?.name || hotel.hotel_name || '').toLowerCase();
        const isTestHotel = /test|demo|do not use|sample|fake/i.test(name);
        return !isTestHotel && hotel.property?.photoUrls?.length > 0;
      })
      .map((hotel: any) => {
        const property = hotel.property || hotel;
        const priceBreakdown = hotel.priceBreakdown || hotel.composite_price_breakdown || {};
        
        // Get base price from Booking.com
        const grossPrice = priceBreakdown.gross_price?.value || 
                          priceBreakdown.grossPrice?.value ||
                          hotel.min_total_price ||
                          0;
        
        const hotelCurrency = priceBreakdown.gross_price?.currency ||
                             priceBreakdown.currency ||
                             hotel.currency_code ||
                             currency;
        
        // Calculate price per night and apply 15% markup
        const totalPrice = parseFloat(grossPrice);
        const pricePerNight = totalPrice / nights;
        const markedUpPricePerNight = pricePerNight * 1.15;
        const markedUpTotalPrice = totalPrice * 1.15;

        // Apply price filter if specified
        if (max_total_price && markedUpPricePerNight > max_total_price) {
          return null;
        }

        // Extract and normalize photos to ensure HTTPS and valid URLs
        const rawPhotoUrls = property.photoUrls || 
                            property.photo_urls ||
                            (hotel.hotel_photos?.map((p: any) => p.url_max) || []);
        
        const photoUrls = Array.from(new Set(
          rawPhotoUrls
            .map((url: any) => {
              if (typeof url !== 'string') return '';
              // Ensure HTTPS protocol
              return url.replace(/^http:\/\//i, 'https://');
            })
            .filter((url: string) => url && /^https?:\/\//i.test(url))
        )).slice(0, 12);

        // Extract reviews
        const reviewScore = property.reviewScore || 
                           property.review_score ||
                           hotel.review_score ||
                           0;
        
        const reviewCount = property.reviewCount || 
                           property.review_count ||
                           hotel.review_nr ||
                           0;

        return {
          hotel_id: property.id || hotel.hotel_id,
          name: property.name || hotel.hotel_name || "Hotel",
          address: hotel.address || property.address || "",
          city: hotel.city || property.city || location,
          country: hotel.country_code || property.countryCode || "",
          rating: reviewScore,
          num_reviews: reviewCount,
          source: 'booking.com',
          hasBookingData: true,
          image_url: photoUrls[0] || "",
          property: {
            name: property.name || hotel.hotel_name,
            photoUrls,
            reviews: [],
            reviewScore,
            reviewCount,
            externalUrls: {
              booking: hotel.url || `https://www.booking.com/hotel/${property.id || hotel.hotel_id}.html`,
              default: hotel.url || ""
            }
          },
          location: hotel.city || property.city || location,
          price: markedUpPricePerNight,
          basePrice: pricePerNight,
          priceBreakdown: {
            grossPrice: { value: markedUpPricePerNight, currency: hotelCurrency },
            totalPrice: { value: markedUpTotalPrice, currency: hotelCurrency },
            baseGrossPrice: { value: pricePerNight, currency: hotelCurrency },
            baseTotalPrice: { value: totalPrice, currency: hotelCurrency },
          },
          numericPrice: markedUpPricePerNight, // For ranking/sorting
          accessibilityLabel: `${property.name || hotel.hotel_name}. ${hotel.city || location}. Price ${markedUpPricePerNight.toFixed(2)} ${hotelCurrency} per night`,
          description: hotel.property?.name || hotel.hotel_name || "",
          amenities: property.amenities || hotel.amenities || [],
          photos: photoUrls,
          reviews: [],
          bookingData: {
            hotelId: property.id || hotel.hotel_id,
            checkInDate: checkIn,
            checkOutDate: checkOut,
            totalPrice: totalPrice,
            basePrice: totalPrice,
          }
        };
      })
      .filter(Boolean); // Remove nulls from price filtering

    // Calculate average photo count for debugging
    const totalPhotos = transformedHotels.reduce((sum, h) => sum + (h.photos?.length || 0), 0);
    const avgPhotos = transformedHotels.length > 0 ? (totalPhotos / transformedHotels.length).toFixed(1) : 0;
    
    console.log(`Transformed ${transformedHotels.length} hotels from Booking.com with 15% markup applied`);
    console.log(`Average ${avgPhotos} photos per hotel (${totalPhotos} total photos)`);

    return new Response(JSON.stringify({ 
      success: true,
      results: transformedHotels,
      source: 'booking.com'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in booking-search-hotels:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ 
      error: errorMessage,
      results: [] 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
