import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// City coordinates for locationBias
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'Paris': { lat: 48.8566, lng: 2.3522 },
  'Tokyo': { lat: 35.6762, lng: 139.6503 },
  'New York': { lat: 40.7128, lng: -74.0060 },
  'London': { lat: 51.5074, lng: -0.1278 },
  'Dubai': { lat: 25.2048, lng: 55.2708 },
  'Rome': { lat: 41.9028, lng: 12.4964 },
  'Barcelona': { lat: 41.3851, lng: 2.1734 },
  'Singapore': { lat: 1.3521, lng: 103.8198 },
  'Hong Kong': { lat: 22.3193, lng: 114.1694 },
  'Bangkok': { lat: 13.7563, lng: 100.5018 },
  'Sydney': { lat: -33.8688, lng: 151.2093 },
  'Buenos Aires': { lat: -34.6037, lng: -58.3816 },
  'Amsterdam': { lat: 52.3676, lng: 4.9041 },
  'Lisbon': { lat: 38.7223, lng: -9.1393 },
  'Kyoto': { lat: 35.0116, lng: 135.7681 },
  'Cape Town': { lat: -33.9249, lng: 18.4241 },
  'Marrakesh': { lat: 31.6295, lng: -7.9811 },
  'Vancouver': { lat: 49.2827, lng: -123.1207 },
  'Rio de Janeiro': { lat: -22.9068, lng: -43.1729 },
  'Cairo': { lat: 30.0444, lng: 31.2357 },
  'Seville': { lat: 37.3891, lng: -5.9845 },
  'Reykjavik': { lat: 64.1466, lng: -21.9426 },
  'Santorini': { lat: 36.3932, lng: 25.4615 },
  'Abu Dhabi': { lat: 24.4539, lng: 54.3773 },
  'Doha': { lat: 25.2854, lng: 51.5310 },
  'Maldives': { lat: 4.1755, lng: 73.5093 },
  'Bhutan': { lat: 27.5142, lng: 90.4336 },
  'Queenstown': { lat: -45.0312, lng: 168.6626 },
  'Havana': { lat: 23.1136, lng: -82.3666 },
  'Luxor': { lat: 25.6872, lng: 32.6396 }
};

const RESERVATION_PLATFORMS = [
  'opentable.com',
  'resy.com',
  'sevenrooms.com',
  'thefork.com',
  'quandoo.com',
  'chope.co',
  'bookatable.co.uk',
  'covermanager.com'
];

// Simple in-memory cache with 5-minute TTL
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(city: string, cuisine?: string, minRating?: number): string {
  return `${city}|${cuisine || 'all'}|${minRating || 4.3}`;
}

function getFromCache(key: string): any | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

function detectReservationPlatform(websiteUri: string): string | null {
  try {
    const url = new URL(websiteUri);
    const hostname = url.hostname.toLowerCase();
    for (const platform of RESERVATION_PLATFORMS) {
      if (hostname.includes(platform)) {
        return platform;
      }
    }
  } catch {
    return null;
  }
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { city, cuisine, minRating = 4.3, maxResults = 50 } = await req.json();

    if (!city) {
      throw new Error('City is required');
    }

    console.log(`Searching for restaurants in ${city}${cuisine ? ` (${cuisine})` : ''}`);

    // Check cache
    const cacheKey = getCacheKey(city, cuisine, minRating);
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      console.log('Returning cached data');
      return new Response(JSON.stringify(cachedData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get API key from environment (Lovable Cloud secrets)
    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      throw new Error('GOOGLE_MAPS_API_KEY not configured. Please add it in settings.');
    }

    // Build search query
    let searchQuery = cuisine 
      ? `${cuisine} fine dining restaurant in ${city}`
      : `fine dining restaurant in ${city}`;

    const coords = CITY_COORDS[city];
    if (!coords) {
      throw new Error(`Coordinates not found for city: ${city}`);
    }

    // Call Google Places API v1 (Text Search)
    const searchResponse = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.priceLevel,places.websiteUri,places.types,places.businessStatus,places.photos'
      },
      body: JSON.stringify({
        textQuery: searchQuery,
        locationBias: {
          circle: {
            center: {
              latitude: coords.lat,
              longitude: coords.lng
            },
            radius: 50000 // 50km radius
          }
        },
        maxResultCount: Math.min(maxResults, 20)
      })
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('Google Places API error:', errorText);
      throw new Error(`Google Places API error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    const places = searchData.places || [];

    console.log(`Found ${places.length} places from Google`);

    // Filter and transform results
    const restaurants = places
      .filter((place: any) => {
        // Must be operational
        if (place.businessStatus !== 'OPERATIONAL') return false;
        
        // Must be a restaurant
        if (!place.types || !place.types.includes('restaurant')) return false;
        
        // Must have minimum rating
        if (!place.rating || place.rating < minRating) return false;
        
        // Must have a website
        if (!place.websiteUri || !place.websiteUri.startsWith('http')) return false;
        
        return true;
      })
      .map((place: any) => {
        const reservationPlatform = detectReservationPlatform(place.websiteUri);
        
        return {
          id: place.id,
          name: place.displayName?.text || 'Unknown',
          location: place.formattedAddress || '',
          rating: place.rating || 0,
          priceLevel: place.priceLevel ? parseInt(place.priceLevel.replace('PRICE_LEVEL_', '')) : 3,
          cuisine: cuisine || 'Fine Dining',
          image: place.photos?.[0]?.name 
            ? `https://places.googleapis.com/v1/${place.photos[0].name}/media?key=${apiKey}&maxHeightPx=400&maxWidthPx=600`
            : 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0',
          website: place.websiteUri,
          reservationPlatform: reservationPlatform,
          googlePlacesId: place.id,
          userRatingCount: place.userRatingCount || 0
        };
      });

    console.log(`Filtered to ${restaurants.length} valid restaurants`);

    const result = {
      restaurants,
      count: restaurants.length,
      city,
      cuisine: cuisine || null
    };

    // Cache the result
    setCache(cacheKey, result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in restaurants-search-google:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    return new Response(JSON.stringify({ error: errorMessage, restaurants: [], count: 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
