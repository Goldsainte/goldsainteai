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
    const { location, checkIn, checkOut, guests = 2 } = await req.json();
    
    console.log('TripAdvisor hotel search request:', { 
      location, 
      checkIn, 
      checkOut,
      guests 
    });

    const apiKey = Deno.env.get('TRIPADVISOR_API_KEY');
    
    if (!apiKey) {
      throw new Error('TripAdvisor API key not configured');
    }

    // Search for hotels in the location
    const searchParams = new URLSearchParams({
      key: apiKey,
      searchQuery: location,
      category: 'hotels',
      language: 'en'
    });

    const searchResponse = await fetch(
      `https://api.content.tripadvisor.com/api/v1/location/search?${searchParams}`,
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    if (!searchResponse.ok) {
      const error = await searchResponse.text();
      console.error('TripAdvisor search error:', error);
      throw new Error(`Hotel search failed: ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();
    console.log('Hotels found:', searchData.data?.length || 0);

    // Get detailed information for each hotel (optimized: fewer items + parallel sub-requests)
    const hotelDetails = await Promise.all(
      (searchData.data || []).slice(0, 8).map(async (hotel: any) => {
        try {
          const detailsParams = new URLSearchParams({
            key: apiKey,
            language: 'en'
          });

          // Fetch details, photos, and reviews in parallel to reduce latency
          const [detailsResponse, photosResponse, reviewsResponse] = await Promise.all([
            fetch(
              `https://api.content.tripadvisor.com/api/v1/location/${hotel.location_id}/details?${detailsParams}`,
              { headers: { 'Accept': 'application/json' } }
            ),
            fetch(
              `https://api.content.tripadvisor.com/api/v1/location/${hotel.location_id}/photos?${detailsParams}`,
              { headers: { 'Accept': 'application/json' } }
            ),
            fetch(
              `https://api.content.tripadvisor.com/api/v1/location/${hotel.location_id}/reviews?${detailsParams}`,
              { headers: { 'Accept': 'application/json' } }
            )
          ]);

          if (!detailsResponse.ok) {
            console.error(`Failed to fetch details for ${hotel.location_id}`);
            return null;
          }

          const [details, photosData, reviewsData] = await Promise.all([
            detailsResponse.json(),
            photosResponse.ok ? photosResponse.json() : Promise.resolve({ data: [] }),
            reviewsResponse.ok ? reviewsResponse.json() : Promise.resolve({ data: [] })
          ]);

          const photos = (photosData.data || []).slice(0, 5);
          const reviews = (reviewsData.data || []).slice(0, 3);

          return {
            id: hotel.location_id,
            name: details.name || hotel.name,
            address: details.address_obj?.address_string || '',
            city: details.address_obj?.city || '',
            country: details.address_obj?.country || '',
            rating: details.rating || 0,
            num_reviews: details.num_reviews || 0,
            price_level: details.price_level || '',
            description: details.description || '',
            amenities: details.amenities || [],
            photos: photos.map((photo: any) => ({
              url: photo.images?.large?.url || photo.images?.original?.url,
              caption: photo.caption || ''
            })),
            reviews: reviews.map((review: any) => ({
              rating: review.rating || 0,
              text: review.text || '',
              published_date: review.published_date || '',
              user: review.user?.username || 'Anonymous'
            })),
            web_url: details.web_url || '',
            latitude: details.latitude,
            longitude: details.longitude,
            // Estimated pricing (TripAdvisor API doesn't provide exact prices without booking partner integration)
            estimated_price: calculateEstimatedPrice(details.price_level, guests),
            currency: 'USD'
          };
        } catch (error) {
          console.error(`Error fetching details for hotel ${hotel.location_id}:`, error);
          return null;
        }
      })
    );

    const validHotels = hotelDetails.filter(hotel => hotel !== null);

    return new Response(JSON.stringify({ 
      results: validHotels,
      checkIn,
      checkOut,
      guests
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in tripadvisor-search-hotels:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

// Helper function to estimate price based on TripAdvisor's price level
function calculateEstimatedPrice(priceLevel: string, guests: number): number {
  const basePrices: { [key: string]: number } = {
    '$': 80,
    '$$ - $$$': 150,
    '$$$$': 300
  };
  
  const basePrice = basePrices[priceLevel] || 120;
  return basePrice * Math.ceil(guests / 2); // Assuming 2 guests per room
}
