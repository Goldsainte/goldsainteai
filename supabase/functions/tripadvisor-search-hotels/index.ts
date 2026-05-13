import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://goldsainte.ai',
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

    // Paginate through TripAdvisor search results to fetch more hotels
    const perPage = 10; // TripAdvisor API returns up to 10 per page
    let offset = 0;
    const allSearchResults: any[] = [];

    while (true) {
      const searchParams = new URLSearchParams({
        key: apiKey,
        searchQuery: location,
        category: 'hotels',
        language: 'en',
        limit: String(perPage),
        offset: String(offset),
      });

      const searchResponse = await fetch(
        `https://api.content.tripadvisor.com/api/v1/location/search?${searchParams}`,
        { headers: { 'Accept': 'application/json' } }
      );

      if (!searchResponse.ok) {
        const error = await searchResponse.text();
        console.error('TripAdvisor search error:', error);
        throw new Error(`Hotel search failed: ${searchResponse.statusText}`);
      }

      const searchData = await searchResponse.json();
      const page = searchData.data || [];
      allSearchResults.push(...page);
      console.log(`Fetched page with ${page.length} hotels (total: ${allSearchResults.length})`);

      if (page.length === 0) {
        console.log('No more pages available from TripAdvisor API');
        break;
      }
      offset += page.length;

      // Limit to 100 results for faster loading
      if (allSearchResults.length >= 100) {
        console.log('Reached maximum limit of 100 results');
        break;
      }
    }

    // Get detailed information for each hotel (batched to limit concurrency)
    const batchSize = 20;
    const hotelDetails = await Promise.all(
      allSearchResults.map(async (hotel: any) => {
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
              `https://api.content.tripadvisor.com/api/v1/location/${hotel.location_id}/photos?${detailsParams}&limit=200`,
              { headers: { 'Accept': 'application/json' } }
            ),
            fetch(
              `https://api.content.tripadvisor.com/api/v1/location/${hotel.location_id}/reviews?${detailsParams}&limit=200`,
              { headers: { 'Accept': 'application/json' } }
            )
          ]);

          if (!detailsResponse.ok) {
            console.error(`Failed to fetch details for ${hotel.location_id}`);
            // Fallback: still return hotel using photos/reviews when details fail
            const photosData = photosResponse.ok ? await photosResponse.json() : { data: [] };
            const reviewsData = reviewsResponse.ok ? await reviewsResponse.json() : { data: [] };
            const photos = (photosData.data || []).slice(0, 30);
            const reviews = (reviewsData.data || []).slice(0, 50);

            return {
              id: hotel.location_id,
              name: hotel.name,
              address: '',
              city: '',
              country: '',
              rating: 0,
              num_reviews: reviews.length,
              price_level: '',
              description: '',
              amenities: [],
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
              web_url: '',
              latitude: undefined,
              longitude: undefined,
              estimated_price: calculateEstimatedPrice('', guests),
              currency: 'USD'
            };
          }

          const [details, photosData, reviewsData] = await Promise.all([
            detailsResponse.json(),
            photosResponse.ok ? photosResponse.json() : Promise.resolve({ data: [] }),
            reviewsResponse.ok ? reviewsResponse.json() : Promise.resolve({ data: [] })
          ]);

          const photos = (photosData.data || []).slice(0, 30);
          const reviews = (reviewsData.data || []).slice(0, 50);

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
