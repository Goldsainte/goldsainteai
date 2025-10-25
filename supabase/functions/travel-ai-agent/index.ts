import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

console.log('[BOOT] Lovable AI key present:', !!LOVABLE_API_KEY);

// Shared helper: Map common city abbreviations and airport codes to full names
function getCityVariations(location: string): string[] {
  const normalizeLocation = (loc: string) => 
    (loc || '').toLowerCase().replace(/\s+city\s*/gi, '').trim();
  
  const cityAbbreviations: { [key: string]: string[] } = {
    'nyc': ['new york', 'ny'],
    'jfk': ['new york', 'ny', 'nyc'],
    'lga': ['new york', 'ny', 'nyc'],
    'ewr': ['new york', 'ny', 'nyc', 'newark'],
    'la': ['los angeles'],
    'lax': ['los angeles', 'la'],
    'sf': ['san francisco'],
    'sfo': ['san francisco', 'sf'],
    'dc': ['washington'],
    'dca': ['washington', 'dc'],
    'iad': ['washington', 'dc'],
    'philly': ['philadelphia'],
    'phl': ['philadelphia', 'philly'],
    'vegas': ['las vegas'],
    'las': ['las vegas', 'vegas'],
    'chi': ['chicago'],
    'ord': ['chicago', 'chi'],
    'mdw': ['chicago', 'chi'],
    'mia': ['miami'],
    'bos': ['boston'],
    'sea': ['seattle'],
    'atl': ['atlanta'],
    'dfw': ['dallas'],
    'dal': ['dallas'],
    'iah': ['houston'],
    'hou': ['houston'],
    'phx': ['phoenix'],
    'den': ['denver'],
    'mco': ['orlando'],
    'dtw': ['detroit'],
    'msp': ['minneapolis'],
    'pdx': ['portland'],
    'san': ['san diego'],
    'aus': ['austin'],
    'bna': ['nashville'],
    'slc': ['salt lake city'],
    'clt': ['charlotte']
  };
  
  const searchLocation = normalizeLocation(location);
  const searchVariations = [searchLocation];
  
  if (cityAbbreviations[searchLocation]) {
    searchVariations.push(...cityAbbreviations[searchLocation]);
  }
  
  // Also check if the search is a full name that matches an abbreviation
  for (const [abbrev, fullNames] of Object.entries(cityAbbreviations)) {
    if (fullNames.some((name) => {
      const n = (name || '').toLowerCase().trim();
      // Avoid false positives like "la" matching "atlanta"
      if (n.length < 3) return searchLocation === n; // exact match only for very short tokens
      return searchLocation.includes(n);
    })) {
      searchVariations.push(abbrev, ...fullNames);
    }
  }
  
  return [...new Set(searchVariations)]; // Remove duplicates
}

// Get the best/full city name from abbreviation or airport code
function normalizeCityName(location: string): string {
  const variations = getCityVariations(location);
  // Return the longest variation (usually the full name)
  return variations.sort((a, b) => b.length - a.length)[0] || location;
}

// ============= SLOT-FILLING SYSTEM =============

interface SearchSlots {
  // Hotel slots
  location?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  budget?: { min?: number; max?: number };
  
  // Flight slots
  origin?: string;
  destination?: string;
  departureDate?: string;
  returnDate?: string;
  adults?: number;
  tripType?: 'one-way' | 'round-trip';
  
  // Universal
  preferences?: string[];
}

interface SearchState {
  type?: 'hotel' | 'flight' | 'restaurant' | 'event' | 'package';
  slots: SearchSlots;
  filledSlots: string[];
  requiredSlots: string[];
  lastSearch?: {
    params: any;
    timestamp: number;
  };
}

// Calculate next weekend dates
function calculateNextWeekend(currentDate: Date): { checkIn: string; checkOut: string } {
  const day = currentDate.getDay();
  const daysUntilFriday = (5 - day + 7) % 7 || 7; // If today is Friday, go to next Friday
  const friday = new Date(currentDate);
  friday.setDate(friday.getDate() + daysUntilFriday);
  const sunday = new Date(friday);
  sunday.setDate(sunday.getDate() + 2);
  
  return {
    checkIn: friday.toISOString().split('T')[0],
    checkOut: sunday.toISOString().split('T')[0]
  };
}

// Calculate relative date (tomorrow, in X days, etc.)
function calculateRelativeDate(currentDate: Date, daysToAdd: number): string {
  const targetDate = new Date(currentDate);
  targetDate.setDate(targetDate.getDate() + daysToAdd);
  return targetDate.toISOString().split('T')[0];
}

// Extract parameters from natural language message
function extractParametersFromMessage(message: string, currentDate = new Date()): Partial<SearchSlots> {
  const extracted: Partial<SearchSlots> = {};
  const normalized = message.toLowerCase();
  
  // Extract dates using existing parseDates function
  const dates = parseDates(message);
  if (dates.checkIn) extracted.checkIn = dates.checkIn;
  if (dates.checkOut) extracted.checkOut = dates.checkOut;
  
  // Extract relative dates
  if (/next weekend|this weekend/i.test(normalized)) {
    const { checkIn, checkOut } = calculateNextWeekend(currentDate);
    extracted.checkIn = checkIn;
    extracted.checkOut = checkOut;
  } else if (/tomorrow/i.test(normalized)) {
    extracted.checkIn = calculateRelativeDate(currentDate, 1);
  } else if (/in (\d+) days?/i.test(normalized)) {
    const match = normalized.match(/in (\d+) days?/);
    if (match) {
      extracted.checkIn = calculateRelativeDate(currentDate, parseInt(match[1]));
    }
  }
  
  // Extract guest/passenger counts
  const guestMatch = normalized.match(/(\d+)\s*(people|guests|adults|travelers|persons|pax)/);
  if (guestMatch) {
    const count = parseInt(guestMatch[1]);
    extracted.guests = count;
    extracted.adults = count;
  }
  
  // Extract trip type
  if (/round.?trip|return/i.test(normalized)) {
    extracted.tripType = 'round-trip';
  } else if (/one.?way/i.test(normalized)) {
    extracted.tripType = 'one-way';
  }
  
  // Extract locations using patterns
  const locationPatterns = [
    /\b(?:in|to|at|near)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
    /\b(?:from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g
  ];
  
  // Extract destination (in/to/at/near)
  const destMatches = [...message.matchAll(locationPatterns[0])];
  if (destMatches.length > 0) {
    const city = destMatches[destMatches.length - 1][1]; // Get last match
    extracted.location = city;
    extracted.destination = city;
  }
  
  // Extract origin (from)
  const originMatches = [...message.matchAll(locationPatterns[1])];
  if (originMatches.length > 0) {
    extracted.origin = originMatches[0][1];
  }
  
  return extracted;
}

// Detect search intent type
function detectSearchType(message: string): 'hotel' | 'flight' | 'restaurant' | 'event' | 'package' | undefined {
  const normalized = message.toLowerCase();
  
  if (/\b(hotel|stay|accommodation|lodging|room)\b/i.test(normalized)) {
    return 'hotel';
  } else if (/\b(flight|fly|plane|airline)\b/i.test(normalized)) {
    return 'flight';
  } else if (/\b(restaurant|food|dining|eat)\b/i.test(normalized)) {
    return 'restaurant';
  } else if (/\b(event|concert|show|performance)\b/i.test(normalized)) {
    return 'event';
  } else if (/\b(package|trip|vacation|getaway)\b/i.test(normalized)) {
    return 'package';
  }
  
  return undefined;
}

// Get required slots for search type
function getRequiredSlots(type: string | undefined): string[] {
  switch (type) {
    case 'hotel':
      return ['location', 'checkIn', 'checkOut'];
    case 'flight':
      return ['origin', 'destination', 'departureDate'];
    case 'package':
      return ['origin', 'destination', 'departureDate', 'returnDate'];
    case 'restaurant':
      return ['location'];
    case 'event':
      return ['location'];
    default:
      return [];
  }
}

// Check if all required slots are filled
function checkSlotCompleteness(state: SearchState): {
  complete: boolean;
  missing: string[];
  canSearch: boolean;
} {
  const { slots, requiredSlots } = state;
  const missing: string[] = [];
  
  for (const slot of requiredSlots) {
    const value = (slots as any)[slot];
    if (!value || value === undefined || value === null || value === '') {
      missing.push(slot);
    }
  }
  
  return {
    complete: missing.length === 0,
    missing,
    canSearch: missing.length === 0
  };
}

// Get latest conversation state from history
function getLatestConversationState(history: any[]): SearchState | null {
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].conversationState) {
      return history[i].conversationState;
    }
  }
  return null;
}

// Helpers: parse single dates or ranges and normalize to YYYY-MM-DD
function pad(n: number) { return n.toString().padStart(2, '0'); }
function toISO(y: number, m: number, d: number) { return `${y}-${pad(m)}-${pad(d)}`; }

function parseDates(input: string): { checkIn?: string; checkOut?: string } {
  if (!input) return {};
  const s = input.trim().toLowerCase();
  
  // Month name mapping for natural language parsing
  const monthMap: Record<string, number> = {
    'january': 1, 'jan': 1,
    'february': 2, 'feb': 2,
    'march': 3, 'mar': 3,
    'april': 4, 'apr': 4,
    'may': 5,
    'june': 6, 'jun': 6,
    'july': 7, 'jul': 7,
    'august': 8, 'aug': 8,
    'september': 9, 'sep': 9, 'sept': 9,
    'october': 10, 'oct': 10,
    'november': 11, 'nov': 11,
    'december': 12, 'dec': 12
  };
  
  // System date context: October 25, 2025
  const currentYear = 2025;
  const currentMonth = 10; // October
  
  // Parse "november 10-14" or "nov 10th-14th" or "november 10 to 14"
  const naturalRange = s.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?\s*(?:to|-|–|—|through|until)\s*(\d{1,2})(?:st|nd|rd|th)?/i);
  
  if (naturalRange) {
    const month = monthMap[naturalRange[1].toLowerCase()];
    const day1 = Number(naturalRange[2]);
    const day2 = Number(naturalRange[3]);
    
    // Determine year: if month is before current month, use next year
    let year = currentYear;
    if (month < currentMonth) {
      year = currentYear + 1;
    }
    
    console.log(`[parseDates] Natural range: ${naturalRange[1]} ${day1}-${day2} → ${year}-${pad(month)}-${pad(day1)} to ${year}-${pad(month)}-${pad(day2)}`);
    
    return {
      checkIn: toISO(year, month, day1),
      checkOut: toISO(year, month, day2)
    };
  }
  
  // ISO range: 2025-10-10 to 2025-10-13
  const isoRange = s.match(/(\d{4}-\d{2}-\d{2})\s*(?:to|-|–|—|until)\s*(\d{4}-\d{2}-\d{2})/i);
  if (isoRange) {
    console.log(`[parseDates] ISO range: ${isoRange[1]} to ${isoRange[2]}`);
    return { checkIn: isoRange[1], checkOut: isoRange[2] };
  }

  // MM/DD/YYYY range
  const mdyRange = s.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\s*(?:to|-|–|—|until)\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i);
  if (mdyRange) {
    const m1 = Number(mdyRange[1]), d1 = Number(mdyRange[2]), y1 = Number(mdyRange[3]);
    const m2 = Number(mdyRange[4]), d2 = Number(mdyRange[5]), y2 = Number(mdyRange[6]);
    console.log(`[parseDates] MM/DD/YYYY range: ${m1}/${d1}/${y1} to ${m2}/${d2}/${y2}`);
    return { checkIn: toISO(y1, m1, d1), checkOut: toISO(y2, m2, d2) };
  }

  // Single ISO date
  const isoSingle = s.match(/(\d{4}-\d{2}-\d{2})/);
  if (isoSingle) {
    console.log(`[parseDates] ISO single: ${isoSingle[1]}`);
    return { checkIn: isoSingle[1] };
  }
  
  // Single MM/DD/YYYY
  const mdy = s.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (mdy) {
    const date = toISO(Number(mdy[3]), Number(mdy[1]), Number(mdy[2]));
    console.log(`[parseDates] MM/DD/YYYY single: ${date}`);
    return { checkIn: date };
  }

  console.log('[parseDates] No date pattern matched:', input);
  return {};
}

// Helper functions for tool execution
async function searchHotels(args: any) {
  // Use unified hotel search for consistency with Search page
  try {
    let { location, checkIn, checkOut, guests = 2, sortBy, minRating, maxPrice } = args;
    console.log('🔍 [HOTEL SEARCH] Raw arguments:', args);
    
    // Validate dates are in the future
    const today = new Date('2025-10-25'); // Current system date
    today.setHours(0, 0, 0, 0); // Reset time for fair comparison
    
    if (checkIn) {
      const checkInDate = new Date(checkIn);
      checkInDate.setHours(0, 0, 0, 0);
      
      if (checkInDate < today) {
        console.error(`❌ [HOTEL SEARCH] Check-in date ${checkIn} is in the past`);
        return {
          error: `Check-in date ${checkIn} is in the past. Please provide future dates (November 2025 or later).`,
          results: [],
          suggestion: 'Try dates in November 2025 or later'
        };
      }
    }
    
    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      
      if (checkOutDate <= checkInDate) {
        console.error(`❌ [HOTEL SEARCH] Check-out ${checkOut} must be after check-in ${checkIn}`);
        return {
          error: 'Check-out date must be after check-in date',
          results: []
        };
      }
    }
    
    // Require dates before searching
    if (!checkIn || !checkOut) {
      console.error('❌ [HOTEL SEARCH] Missing required dates');
      return {
        error: 'Check-in and check-out dates are required to search hotels. Please provide dates.',
        results: []
      };
    }
    
    console.log('✅ [HOTEL SEARCH] Date validation passed:', { checkIn, checkOut });
    console.log('🔍 [HOTEL SEARCH] Calling unified-search-hotels with:', { location, checkIn, checkOut, guests });

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    const response = await fetch(`${supabaseUrl}/functions/v1/unified-search-hotels`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        location,
        checkIn,
        checkOut,
        guests: guests || 2
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Unified hotel search error:', response.status, errorText);
      return { error: `Could not find hotels in "${location}". Please try a different location.`, results: [] };
    }

    const data = await response.json();
    let hotels = data.results || [];
    
    console.log(`Unified search returned ${hotels.length} hotels`);

    // Apply filters
    if (typeof minRating === 'number') {
      const minRatingNormalized = minRating > 5 ? minRating / 2 : minRating;
      hotels = hotels.filter((h: any) => (h.rating || 0) >= minRatingNormalized);
    }
    if (typeof maxPrice === 'number') {
      hotels = hotels.filter((h: any) => (h.price || 0) <= maxPrice);
    }
    if (sortBy === 'price') {
      hotels.sort((a: any, b: any) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === 'review_score') {
      hotels.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
    }

    console.log(`After filters: ${hotels.length} hotels`);
    
    // LIMIT hotels to 15 max to prevent token overflow
    hotels = hotels.slice(0, 15);

    return {
      type: 'hotels',
      location: { name: location, dest_id: location },
      results: hotels,
      checkIn,
      checkOut,
      guests,
      filters: { sortBy, minRating, maxPrice }
    };
  } catch (error) {
    console.error('Error in searchHotels:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error', results: [] };
  }
}

async function searchDestinations(args: any, apiKey: string) {
  try {
    const { query } = args;

    const response = await fetch(
      `https://booking-com15.p.rapidapi.com/api/v1/hotels/searchDestination?query=${encodeURIComponent(query)}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'booking-com15.p.rapidapi.com'
        }
      }
    );

    if (!response.ok) {
      return { error: 'Failed to search destinations', results: [] };
    }

    const data = await response.json();
    
    return {
      type: 'destinations',
      results: data.data || []
    };
  } catch (error) {
    console.error('Error searching destinations:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { error: errorMessage, results: [] };
  }
}

async function searchRestaurants(args: any) {
  try {
    const { location, cuisine, priceRange } = args;
    
    // Normalize location using abbreviation mapping
    const normalizedLocation = normalizeCityName(location);
    console.log('searchRestaurants called with:', { location, normalizedLocation, cuisine, priceRange });

    const tripAdvisorKey = Deno.env.get('TRIPADVISOR_API_KEY');
    if (!tripAdvisorKey) {
      return { error: 'TripAdvisor API key not configured', results: [] };
    }

    // Build search query with normalized location
    let searchQuery = normalizedLocation;
    if (cuisine) {
      searchQuery += ` ${cuisine}`;
    }

    // Paginated search for restaurants to get a broader set of candidates
    const perPage = 10;
    let offset = 0;
    const allSearchResults: any[] = [];

    while (true) {
      const searchParams = new URLSearchParams({
        key: tripAdvisorKey,
        searchQuery: searchQuery,
        category: 'restaurants',
        language: 'en',
        limit: String(perPage),
        offset: String(offset),
      });

      const searchResponse = await fetch(
        `https://api.content.tripadvisor.com/api/v1/location/search?${searchParams}`,
        { headers: { 'Accept': 'application/json' } }
      );

      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        console.error('TripAdvisor search error:', searchResponse.status, errorText);
        return { error: `Could not find restaurants in "${location}". Please try a different location. (Status: ${searchResponse.status})`, results: [] };
      }

      const searchData = await searchResponse.json();
      const page = searchData.data || [];
      allSearchResults.push(...page);
      console.log(`TripAdvisor page fetched: ${page.length} items (total: ${allSearchResults.length})`);

      if (page.length === 0) break;
      offset += page.length;

      // Cap for latency; we don't need thousands for a good UX
      if (allSearchResults.length >= 30) break;
    }

    // Get detailed information for each restaurant with throttling and fallback
    const MAX_RESULTS = 20;
    const batchSize = 5;
    const items = allSearchResults.slice(0, MAX_RESULTS);

    const chunks: any[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      chunks.push(items.slice(i, i + batchSize));
    }

    const restaurantDetails: any[] = [];
    for (const group of chunks) {
      const groupResults = await Promise.all(
        group.map(async (restaurant: any) => {
          try {
            const detailsParams = new URLSearchParams({
              key: tripAdvisorKey,
              language: 'en'
            });

            const detailsResponse = await fetch(
              `https://api.content.tripadvisor.com/api/v1/location/${restaurant.location_id}/details?${detailsParams}`,
              { headers: { 'Accept': 'application/json' } }
            );

            if (!detailsResponse.ok) {
              // Fallback minimal info when details endpoint fails (rate limits, missing entity, etc.)
              const fallbackCity = restaurant.address_obj?.city || normalizedLocation;
              const googleReservationsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${restaurant.name} ${fallbackCity}`)}`;
              return {
                id: restaurant.location_id,
                name: restaurant.name,
                address: restaurant.address_obj?.address_string || '',
                city: fallbackCity,
                country: restaurant.address_obj?.country || '',
                rating: 0,
                num_reviews: 0,
                userRatingsTotal: 0,
                price_level: '',
                priceLevel: 0,
                cuisine: '',
                description: '',
                photos: [],
                photoUrl: null,
                web_url: '',
                phone: '',
                website: '',
                reservationUrl: googleReservationsUrl,
                reviews: [],
                hours: {},
                openNow: undefined,
                latitude: undefined,
                longitude: undefined
              };
            }

            const details = await detailsResponse.json();

            // Get photos (optional)
            const photosParams = new URLSearchParams({
              key: tripAdvisorKey,
              language: 'en'
            });

            const photosResponse = await fetch(
              `https://api.content.tripadvisor.com/api/v1/location/${restaurant.location_id}/photos?${photosParams}`,
              { headers: { 'Accept': 'application/json' } }
            );

            // Fetch reviews (optional)
            const reviewsParams = new URLSearchParams({
              key: tripAdvisorKey,
              language: 'en'
            });
            const reviewsResponse = await fetch(
              `https://api.content.tripadvisor.com/api/v1/location/${restaurant.location_id}/reviews?${reviewsParams}`,
              { headers: { 'Accept': 'application/json' } }
            );

            let photos: any[] = [];
            if (photosResponse.ok) {
              const photosData = await photosResponse.json();
              photos = photosData.data || [];
            }

            let reviews: any[] = [];
            if (reviewsResponse.ok) {
              const reviewsData = await reviewsResponse.json();
              reviews = (reviewsData.data || []).slice(0, 3);
            }

            if (priceRange && details.price_level && details.price_level !== priceRange) {
              return null;
            }

            // Construct Google Reservations URL for consistency
            const primaryUrl = details.website || details.web_url || '';
            const googleReservationsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${details.name || restaurant.name} ${details.address_obj?.city || normalizedLocation}`)}`;
            const reservationUrl = primaryUrl 
              ? (primaryUrl.startsWith('http') ? primaryUrl : `https://${primaryUrl}`)
              : googleReservationsUrl;

            return {
              id: restaurant.location_id,
              name: details.name || restaurant.name,
              address: details.address_obj?.address_string || '',
              city: details.address_obj?.city || '',
              country: details.address_obj?.country || '',
              rating: details.rating || 0,
              num_reviews: details.num_reviews || 0,
              userRatingsTotal: details.num_reviews || 0,
              price_level: details.price_level || '',
              priceLevel: details.price_level ? details.price_level.split('$').length - 1 : 0,
              cuisine: details.cuisine?.map((c: any) => c.name).join(', ') || '',
              description: details.description || '',
              photos: photos.map((photo: any) => ({
                url: photo.images?.large?.url || photo.images?.original?.url,
                caption: photo.caption || ''
              })),
              photoUrl: photos[0]?.images?.large?.url || photos[0]?.images?.original?.url || null,
              web_url: details.web_url || '',
              phone: details.phone || '',
              website: details.website || '',
              reservationUrl,
              reviews: reviews.map((review: any) => ({
                rating: review.rating || 0,
                text: review.text || '',
                published_date: review.published_date || '',
                user: review.user?.username || 'Anonymous'
              })),
              hours: details.hours || {},
              openNow: details.is_closed === false,
              latitude: details.latitude,
              longitude: details.longitude
            };
          } catch (error) {
            console.error(`Error fetching details for restaurant ${restaurant.location_id}:`, error);
            return null;
          }
        })
      );
      restaurantDetails.push(...groupResults);
    }

    // Filter out nulls and verify location match (be lenient if city is missing)
    const validRestaurants = restaurantDetails.filter(restaurant => {
      if (restaurant === null) return false;
      const restaurantCity = (restaurant.city || '').toLowerCase().trim();
      const requestedCity = normalizedLocation.toLowerCase().trim();
      const locationVariations = getCityVariations(location).map(v => v.toLowerCase().trim());

      // If we couldn't resolve a city (due to API limits), keep the item
      if (!restaurantCity) return true;

      return locationVariations.some(variation =>
        restaurantCity.includes(variation) ||
        variation.includes(restaurantCity) ||
        (restaurant.name || '').toLowerCase().includes(variation)
      );
    });
    
    console.log(`Filtered restaurants: ${validRestaurants.length} out of ${restaurantDetails.length} are in ${location}`);
    
    return {
      type: 'restaurants',
      results: validRestaurants,
      location: location
    };
  } catch (error) {
    console.error('Error searching restaurants:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { error: errorMessage, results: [] };
  }
}

async function searchFlights(args: any) {
  try {
    const { origin, destination, departureDate, returnDate, adults = 1, travelClass = 'ECONOMY', nonStop = false, sortBy = 'best' } = args;
    console.log('searchFlights called with:', { origin, destination, departureDate, returnDate, adults, travelClass, nonStop, sortBy });

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      return { error: 'Supabase configuration missing', results: [] };
    }

    // Convert city names to airport codes if needed (improved lookup)
    const getAirportCode = (location: string) => {
      // If already looks like an airport code (3 letters), use it
      if (/^[A-Z]{3}$/i.test(location.trim())) {
        return location.toUpperCase();
      }

      // Comprehensive city to code mapping
      const cityToCode: Record<string, string> = {
        // US Cities
        'new york': 'NYC', 'los angeles': 'LAX', 'san francisco': 'SFO',
        'washington': 'WAS', 'chicago': 'CHI', 'miami': 'MIA',
        'seattle': 'SEA', 'atlanta': 'ATL', 'dallas': 'DFW',
        'houston': 'HOU', 'phoenix': 'PHX', 'denver': 'DEN',
        'orlando': 'MCO', 'detroit': 'DTW', 'minneapolis': 'MSP',
        'portland': 'PDX', 'san diego': 'SAN', 'austin': 'AUS',
        'nashville': 'BNA', 'salt lake city': 'SLC', 'charlotte': 'CLT',
        'boston': 'BOS', 'las vegas': 'LAS', 'philadelphia': 'PHL',
        // Global Cities
        'paris': 'PAR', 'london': 'LON', 'tokyo': 'TYO',
        'dubai': 'DXB', 'singapore': 'SIN', 'hong kong': 'HKG',
        'frankfurt': 'FRA', 'amsterdam': 'AMS', 'madrid': 'MAD',
        'barcelona': 'BCN', 'rome': 'FCO', 'milan': 'MXP',
        // Japan (closest major airports for city names)
        'kyoto': 'KIX', 'osaka': 'KIX', 'nara': 'KIX', 'kobe': 'UKB', 'nagoya': 'NGO',
        // Switzerland
        'zurich': 'ZRH', 'geneva': 'GVA', 'basel': 'BSL',
        'bern': 'ZRH', 'lausanne': 'GVA', 'lucerne': 'ZRH',
        'interlaken': 'ZRH', 'zermatt': 'GVA', 'st moritz': 'ZRH',
        'st. moritz': 'ZRH', 'lugano': 'LUG', 'davos': 'ZRH',
        'grindelwald': 'ZRH', 'montreux': 'GVA'
      };
      
      const lowerLocation = location.toLowerCase().trim();
      
      // Check exact match first
      if (cityToCode[lowerLocation]) {
        return cityToCode[lowerLocation];
      }
      
      // Check if location contains any city name (for phrases like "ski destination in Zermatt")
      for (const [city, code] of Object.entries(cityToCode)) {
        if (lowerLocation.includes(city)) {
          console.log(`Mapped "${location}" to ${code} via city name "${city}"`);
          return code;
        }
      }
      
      // If no match found, try to use first 3 letters but log a warning
      console.warn(`No airport mapping found for "${location}", using fallback code`);
      return location.toUpperCase().slice(0, 3);
    };

    const originCode = getAirportCode(origin);
    const destinationCode = getAirportCode(destination);

    console.log('Airport codes:', { originCode, destinationCode });

    // Call unified flight search
    const flightResponse = await fetch(
      `${supabaseUrl}/functions/v1/unified-search-flights`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({
          origin: originCode,
          destination: destinationCode,
          departureDate,
          returnDate,
          adults,
          travelClass,
          nonStop: nonStop ? 'true' : 'false',
          destinationCity: destination
        })
      }
    );

    if (!flightResponse.ok) {
      console.error('Flight search failed:', flightResponse.status);
      return { 
        error: `Could not find flights from ${origin} to ${destination}. Try different dates or cities.`,
        results: [] 
      };
    }

    const flightData = await flightResponse.json();
    console.log('Flights found:', flightData.results?.length || 0);

    // Sort flights based on sortBy parameter and LIMIT to 15 results max
    let sortedFlights = flightData.results || [];
    
    if (sortBy && sortedFlights.length > 0) {
      switch (sortBy) {
        case 'price':
          sortedFlights.sort((a: any, b: any) => {
            const priceA = parseFloat(a.price.total);
            const priceB = parseFloat(b.price.total);
            return priceA - priceB;
          });
          break;
          
        case 'duration':
          sortedFlights.sort((a: any, b: any) => {
            const getDurationMinutes = (duration: string) => {
              const hours = duration.match(/(\d+)H/)?.[1] || '0';
              const minutes = duration.match(/(\d+)M/)?.[1] || '0';
              return parseInt(hours) * 60 + parseInt(minutes);
            };
            const durationA = getDurationMinutes(a.itineraries[0].duration);
            const durationB = getDurationMinutes(b.itineraries[0].duration);
            return durationA - durationB;
          });
          break;
          
        case 'departure_early':
          sortedFlights.sort((a: any, b: any) => {
            const timeA = new Date(a.itineraries[0].segments[0].departure.at).getTime();
            const timeB = new Date(b.itineraries[0].segments[0].departure.at).getTime();
            return timeA - timeB;
          });
          break;
          
        case 'departure_late':
          sortedFlights.sort((a: any, b: any) => {
            const timeA = new Date(a.itineraries[0].segments[0].departure.at).getTime();
            const timeB = new Date(b.itineraries[0].segments[0].departure.at).getTime();
            return timeB - timeA;
          });
          break;
          
        case 'best':
        default:
          // Keep default sorting
          break;
      }
    }
    
    // LIMIT results to prevent token overflow
    sortedFlights = sortedFlights.slice(0, 15);

    return {
      type: 'flights',
      origin: { code: originCode, name: origin },
      destination: { code: destinationCode, name: destination },
      departureDate,
      returnDate,
      results: sortedFlights,
      dictionaries: flightData.dictionaries,
      meta: flightData.meta,
      filters: { sortBy }
    };

  } catch (error) {
    console.error('Error in searchFlights:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error', results: [] };
  }
}

async function searchCars(args: any) {
  try {
    const { pickupLocation, pickupDate, returnDate, dropoffLocation } = args;
    console.log('searchCars called with:', { pickupLocation, pickupDate, returnDate, dropoffLocation });

    // Convert city names to airport codes if needed
    const getAirportCode = (location: string) => {
      // If already looks like an airport code (3 letters), use it
      if (/^[A-Z]{3}$/i.test(location.trim())) {
        return location.toUpperCase();
      }

      // Comprehensive city to code mapping
      const cityToCode: Record<string, string> = {
        // US Cities
        'new york': 'JFK', 'los angeles': 'LAX', 'san francisco': 'SFO',
        'washington': 'IAD', 'chicago': 'ORD', 'miami': 'MIA',
        'boston': 'BOS', 'seattle': 'SEA', 'atlanta': 'ATL',
        'denver': 'DEN', 'las vegas': 'LAS', 'phoenix': 'PHX',
        'dallas': 'DFW', 'houston': 'IAH', 'detroit': 'DTW',
        'minneapolis': 'MSP', 'orlando': 'MCO', 'philadelphia': 'PHL',
        'nashville': 'BNA', 'salt lake city': 'SLC', 'charlotte': 'CLT',
        // Global Cities
        'paris': 'CDG', 'london': 'LHR', 'tokyo': 'NRT',
        'dubai': 'DXB', 'singapore': 'SIN', 'hong kong': 'HKG',
        'frankfurt': 'FRA', 'amsterdam': 'AMS', 'madrid': 'MAD',
        'barcelona': 'BCN', 'rome': 'FCO', 'milan': 'MXP',
        // Japan (closest major airports for city names)
        'kyoto': 'KIX', 'osaka': 'KIX', 'nara': 'KIX', 'kobe': 'UKB', 'nagoya': 'NGO',
        // Swiss Cities & Destinations  
        'zurich': 'ZRH', 'geneva': 'GVA', 'basel': 'BSL',
        'bern': 'ZRH', 'lausanne': 'GVA', 'lucerne': 'ZRH',
        'interlaken': 'ZRH', 'zermatt': 'GVA', 'st moritz': 'ZRH',
        'st. moritz': 'ZRH', 'lugano': 'LUG', 'davos': 'ZRH',
        'grindelwald': 'ZRH', 'montreux': 'GVA'
      };
      
      const lowerLocation = location.toLowerCase().trim();
      
      // Check exact match first
      if (cityToCode[lowerLocation]) {
        return cityToCode[lowerLocation];
      }
      
      // Check if location contains any city name (for phrases)
      for (const [city, code] of Object.entries(cityToCode)) {
        if (lowerLocation.includes(city)) {
          console.log(`Mapped "${location}" to ${code} via city name "${city}"`);
          return code;
        }
      }
      
      // If no match found, try to use first 3 letters but log a warning
      console.warn(`No airport mapping found for "${location}", using fallback code`);
      return location.toUpperCase().slice(0, 3);
    };

    const pickupCode = getAirportCode(pickupLocation);
    const dropoffCode = dropoffLocation ? getAirportCode(dropoffLocation) : pickupCode;
    console.log('Converted locations to airport codes:', { pickupCode, dropoffCode });

    // Get Amadeus credentials
    const amadeusKey = Deno.env.get('AMADEUS_API_KEY');
    const amadeusSecret = Deno.env.get('AMADEUS_API_SECRET');
    if (!amadeusKey || !amadeusSecret) {
      return { error: 'Amadeus credentials not configured', results: [] };
    }

    // Get Amadeus token
    const tokenResponse = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=client_credentials&client_id=${amadeusKey}&client_secret=${amadeusSecret}`
    });

    if (!tokenResponse.ok) {
      return { error: 'Failed to authenticate with Amadeus', results: [] };
    }

    const { access_token } = await tokenResponse.json();

    // Add times to dates (10:00 AM for pickup and return)
    const pickupDateTime = `${pickupDate}T10:00:00`;
    const returnDateTime = `${returnDate}T10:00:00`;

    // Build query parameters
    const params = new URLSearchParams({
      pickupLocation: pickupCode,
      pickupDateTime: pickupDateTime,
      returnDateTime: returnDateTime,
      currencyCode: 'USD'
    });

    // Add dropoff location if different from pickup
    if (dropoffCode && dropoffCode !== pickupCode) {
      params.append('dropoffLocation', dropoffCode);
    }

    console.log('Calling Amadeus API with params:', params.toString());

    const response = await fetch(
      `https://test.api.amadeus.com/v1/shopping/availability/car-rental-offers?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Amadeus car search error:', error);
      return { error: 'Car search failed', results: [] };
    }

    const data = await response.json();
    console.log('Cars found:', data.data?.length || 0);
    
    // LIMIT cars to 10 max to prevent token overflow
    const cars = (data.data || []).slice(0, 10);

    return {
      type: 'cars',
      pickupLocation: pickupCode,
      dropoffLocation: dropoffCode,
      pickupDate: pickupDateTime,
      returnDate: returnDateTime,
      results: cars,
      meta: data.meta
    };

  } catch (error) {
    console.error('Error in searchCars:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error', results: [] };
  }
}

async function checkVisaRequirements(args: any) {
  try {
    const { fromCountry, toCountry } = args;
    console.log('checkVisaRequirements called with:', { fromCountry, toCountry });
    
    if (!LOVABLE_API_KEY) {
      return { 
        error: 'Visa check service not configured',
        requirement: 'unknown'
      };
    }

    // Use Lovable AI (Gemini) to get accurate visa information
    const prompt = `Provide accurate and up-to-date visa requirements for a traveler from ${fromCountry} visiting ${toCountry}. Include:
    
1. Visa requirement status (required, visa-free, visa on arrival, eVisa)
2. Duration of stay allowed
3. Passport validity requirements
4. Approximate visa fee considerations:
   - Fees vary by destination country
   - Different visa types (tourism, business, study, work) have different fees
   - Petition-based visas (like work visas) may have different fee structures
   - Expedited processing typically costs more
   - Additional charges may apply (SEVIS fees, service center fees)
   - User should verify exact fees on official embassy/consulate website
5. Processing time
6. Official embassy/government website link if available

If visa is required, mention that Goldsainte can assist with the application process and handle all the complexity.

Be specific and factual. Always recommend verifying exact fees and requirements with official government sources.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_completion_tokens: 1000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI error:', response.status, errorText);
      return { 
        error: `Visa information lookup failed: ${response.statusText}`,
        requirement: 'unknown'
      };
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    console.log('Visa requirement AI response:', aiResponse);

    return {
      type: 'visa',
      fromCountry,
      toCountry,
      information: aiResponse,
      source: 'AI-powered visa information'
    };

  } catch (error) {
    console.error('Error in checkVisaRequirements:', error);
    return { 
      error: error instanceof Error ? error.message : 'Unknown error',
      requirement: 'unknown'
    };
  }
}

async function searchEvents(args: any) {
  try {
    const { city, keyword, startDate, endDate, classificationName } = args;
    
    // Normalize city using abbreviation mapping
    const normalizedCity = normalizeCityName(city);
    console.log('searchEvents called with:', { city, normalizedCity, keyword, startDate, endDate, classificationName });

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      return { error: 'Supabase configuration missing', results: [] };
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/search-events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ city: normalizedCity, keyword, startDate, endDate, classificationName }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('search-events error:', response.status, errorText);
      return { error: `Failed to fetch events: ${response.statusText}`, results: [] };
    }

    const data = await response.json();
    console.log('Events found:', data.events?.length || 0);

    return {
      type: 'events',
      results: data.events || [],
      page: data.page,
      city
    };

  } catch (error) {
    console.error('Error in searchEvents:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error', results: [] };
  }
}

function trimPackageDataForAI(packageData: any) {
  return {
    type: packageData.type,
    origin: packageData.origin,
    destination: packageData.destination,
    departureDate: packageData.departureDate,
    returnDate: packageData.returnDate,
    travelers: packageData.travelers,
    estimatedTotal: packageData.estimatedTotal,
    savings: packageData.savings,
    flightCount: packageData.flights?.length || 0,
    hotelCount: packageData.hotels?.length || 0,
    carCount: packageData.cars?.length || 0,
    // Only include summary of cheapest options
    cheapestFlight: packageData.flights?.[0] ? {
      price: packageData.flights[0].price?.total,
      airline: packageData.flights[0].validatingAirlineCodes?.[0],
      duration: packageData.flights[0].itineraries?.[0]?.duration
    } : null,
    cheapestHotel: packageData.hotels?.[0] ? {
      name: packageData.hotels[0].name,
      price: packageData.hotels[0].offers?.[0]?.price?.total,
      rating: packageData.hotels[0].rating
    } : null
  };
}

async function searchPackages(args: any) {
  try {
    const { origin, destination, departureDate, returnDate, travelers, includeHotel = true, includeCar = true, budget } = args;
    console.log('searchPackages called with:', { origin, destination, departureDate, returnDate, travelers, includeHotel, includeCar, budget });

    // Parse budget if provided
    let maxFlightPrice, maxHotelPrice, maxCarPrice;
    if (budget) {
      const match = budget.match(/\$?(\d+)-\$?(\d+)/);
      if (match) {
        const totalMax = parseInt(match[2]);
        // Allocate budget: 50% flights, 30% hotel, 20% car
        maxFlightPrice = Math.floor(totalMax * 0.5);
        maxHotelPrice = Math.floor(totalMax * 0.3);
        maxCarPrice = Math.floor(totalMax * 0.2);
      }
    }

    // Search all components in parallel
    const searches: Promise<any>[] = [
      searchFlights({
        origin,
        destination,
        departureDate,
        returnDate,
        adults: travelers,
        travelClass: 'ECONOMY',
        sortBy: 'price'
      })
    ];

    if (includeHotel) {
      searches.push(searchHotels({
        location: destination,
        checkIn: departureDate,
        checkOut: returnDate,
        guests: travelers,
        sortBy: 'price',
        ...(maxHotelPrice && { maxPrice: maxHotelPrice })
      }));
    }

    if (includeCar) {
      searches.push(searchCars({
        pickupLocation: destination,
        pickupDate: departureDate,
        returnDate,
      }));
    }

    const results = await Promise.all(searches);
    
    // Combine results with LIMITS to prevent token overflow
    const packageResult: any = {
      type: 'package',
      flights: (results[0]?.results || []).slice(0, 10), // Max 10 flights
      hotels: includeHotel ? ((results[1]?.results || []).slice(0, 10)) : [], // Max 10 hotels
      cars: includeCar ? ((results[includeHotel ? 2 : 1]?.results || []).slice(0, 8)) : [], // Max 8 cars
      origin,
      destination,
      departureDate,
      returnDate,
      travelers
    };

    // Calculate sample package prices
    if (packageResult.flights.length > 0 && packageResult.hotels.length > 0) {
      const cheapestFlight = packageResult.flights[0];
      const cheapestHotel = packageResult.hotels[0];
      const flightPrice = parseFloat(cheapestFlight.price?.total || 0);
      const hotelPrice = parseFloat(cheapestHotel.offers?.[0]?.price?.total || 0);
      
      let carPrice = 0;
      if (packageResult.cars.length > 0) {
        carPrice = parseFloat(packageResult.cars[0].price?.total || 0);
      }

      packageResult.estimatedTotal = flightPrice + hotelPrice + carPrice;
      packageResult.savings = Math.floor((flightPrice + hotelPrice + carPrice) * 0.1); // 10% package discount
    }

    console.log('Package search completed:', {
      flights: packageResult.flights.length,
      hotels: packageResult.hotels.length,
      cars: packageResult.cars.length
    });

    return packageResult;

  } catch (error) {
    console.error('Error in searchPackages:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error', results: [] };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory = [], userLocation, isQuickLink = false, quickLinkType, usePreferences = true } = await req.json();
    
    console.log('=== AI AGENT REQUEST ===');
    console.log('User message:', message);
    console.log('History length:', conversationHistory.length);
    if (conversationHistory.length > 0) {
      console.log('Last message:', conversationHistory[conversationHistory.length - 1]);
    }
    console.log('Has location:', !!userLocation);

    const BOOKING_API_KEY = Deno.env.get('BOOKING_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }
    // BOOKING_API_KEY is optional - only needed for search_destinations

    // Get user preferences if authenticated
    const authHeader = req.headers.get('authorization');
    let userPreferences = null;
    let userContext = '';
    
    if (authHeader) {
      try {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_ANON_KEY') ?? '',
          { global: { headers: { Authorization: authHeader } } }
        );
        
        const { data: { user } } = await supabaseClient.auth.getUser();
        
        if (user) {
          const { data } = await supabaseClient
            .from('user_booking_preferences')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
            
          if (data) {
            userPreferences = data;
            
            // Only include strict preferences if the user has them enabled
            if (usePreferences && data.use_preferences_in_search !== false) {
              userContext = `\n\n=== STRICT USER PREFERENCES - ENFORCE THESE AS HARD FILTERS ===

🏨 HOTEL PREFERENCES (Apply to ALL hotel searches):
- Min Star Rating: ${data.preferred_hotel_rating || 'Any'} stars
- Price Range: $${data.price_range_min || 20} - $${data.price_range_max || 1000} per night
- Distance from Center: Max ${data.distance_from_center || 'Any'} miles
- Distance from Airport: Max ${data.distance_from_airport || 'Any'} miles
- Room Type: ${data.room_type || 'Any'}
- Bed Type: ${data.bed_type || 'Any'}
- Property Types: ${data.property_types?.join(', ') || 'Any'}
- Required Amenities: ${data.preferred_amenities?.join(', ') || 'None'}
- Min Review Score: ${data.min_review_score || 'Any'}/10
- Must Have: ${[
  data.free_wifi && 'WiFi',
  data.breakfast_included && 'Breakfast',
  data.pool && 'Pool',
  data.gym && 'Gym',
  data.parking && 'Parking',
  data.pet_friendly && 'Pet-Friendly',
  data.airport_shuttle && 'Airport Shuttle',
  data.accessible_rooms && 'Accessible Rooms'
].filter(Boolean).join(', ') || 'No specific requirements'}

✈️ FLIGHT PREFERENCES (Apply to ALL flight searches):
- Cabin Class: ${data.cabin_class || 'Economy'}
- Max Price per Passenger: $${data.max_price_per_passenger || 1000}
- Max Duration: ${data.max_duration_hours || 'Any'} hours
- Max Layover: ${data.max_layover_hours || 'Any'} hours
- Max Stops: ${data.max_stops ?? 'Any'}
- Direct Flights Only: ${data.direct_flights_only ? 'YES' : 'No'}
- Preferred Airlines: ${data.preferred_airlines?.join(', ') || 'Any'}
- Excluded Airlines: ${data.excluded_airlines?.join(', ') || 'None'}
- Seat Preference: ${data.seat_preference || 'Any'}
- Meal Preference: ${data.meal_preference || 'Regular'}
- Baggage: ${data.baggage_carry_on ? 'Carry-on' : ''} ${data.baggage_checked ? `+ ${data.baggage_checked} checked` : ''}

🍽️ RESTAURANT PREFERENCES (Apply to ALL restaurant searches):
- Cuisine Types: ${data.cuisine_types?.join(', ') || 'Any'}
- Dietary Restrictions: ${data.dietary_restrictions?.join(', ') || 'None'}
- Price Range: ${data.restaurant_price_range || 'Any'}
- Seating: ${data.seating_preference || 'Any'}
- Experience Type: ${data.restaurant_experience_type?.join(', ') || 'Any'}
- Preferred Dining Time: ${data.preferred_dining_time || 'Any'}

🚗 CAR RENTAL PREFERENCES (Apply to ALL car searches):
- Car Type: ${data.car_type || 'Any'}
- Transmission: ${data.transmission_type || 'Automatic'}
- Budget: $${data.car_budget_min || 20} - $${data.car_budget_max || 500} per day
- Features: ${data.car_features?.join(', ') || 'None specified'}
- Fuel Policy: ${data.fuel_policy || 'Full-to-full'}
- Unlimited Mileage: ${data.unlimited_mileage ? 'YES' : 'No'}

🎟️ EVENT PREFERENCES (Apply to ALL event searches):
- Event Types: ${data.event_types?.join(', ') || 'Any'}
- Budget: $${data.event_budget_min || 20} - $${data.event_budget_max || 500} per ticket
- Ticket Type: ${data.ticket_type || 'Any'}
- Time Preference: ${data.event_time_preference || 'Any'}

🛂 TRAVEL DOCUMENTS:
- Passport: ${data.passport_number ? 'On file' : 'Not provided'}
- Nationality: ${data.nationality || 'Not specified'}
- Visa Assistance Needed: ${data.visa_assistance_needed ? 'YES' : 'No'}

${data.special_requests ? `⚠️ SPECIAL REQUESTS: ${data.special_requests}` : ''}

CRITICAL: These are MANDATORY filters. Do NOT show results that violate these preferences unless the user explicitly asks to ignore them.`;
            } else {
              userContext = `\n\n=== USER PREFERENCES AVAILABLE BUT NOT APPLIED ===
The user has saved preferences but has chosen to search without strict filtering. Show all available results regardless of their saved preferences.
===`;
            }
            
            console.log('User preferences loaded:', userPreferences);
          }
        }
      } catch (error) {
        console.error('Error loading user preferences:', error);
      }
    }

    // Sequential question flow with state tracking
    // Get the MOST RECENT quickLinkState, not the first one
    let quickLinkState = [...conversationHistory].reverse().find((msg: any) => msg.quickLinkState)?.quickLinkState;
    
    // Initialize state for quick links
    if (isQuickLink && !quickLinkState) {
      quickLinkState = {
        type: quickLinkType,
        step: 0,
        data: {}
      };
    }
    
    // ============= SLOT-FILLING LOGIC =============
    // Extract parameters from current message
    const extractedParams = extractParametersFromMessage(message, new Date());
    console.log('📊 Extracted parameters from message:', extractedParams);
    
    // Get or initialize conversation state
    let currentState = getLatestConversationState(conversationHistory);
    
    // Detect search type if not already set
    const detectedType = detectSearchType(message);
    
    if (!currentState && detectedType) {
      // Initialize new state
      currentState = {
        type: detectedType,
        slots: {},
        filledSlots: [],
        requiredSlots: getRequiredSlots(detectedType)
      };
      console.log('🆕 Initialized new conversation state:', currentState.type);
    }
    
    // Update state with extracted parameters
    if (currentState && !isQuickLink) {
      currentState.slots = { ...currentState.slots, ...extractedParams };
      currentState.filledSlots = Object.keys(currentState.slots).filter(
        k => (currentState!.slots as any)[k] !== undefined && (currentState!.slots as any)[k] !== null && (currentState!.slots as any)[k] !== ''
      );
      console.log('✅ Updated state - Filled slots:', currentState.filledSlots);
      
      // Check if we can search directly
      const slotStatus = checkSlotCompleteness(currentState);
      console.log('🎯 Slot status:', slotStatus);
      
      // Apply smart defaults for missing non-critical slots
      if (slotStatus.missing.length === 1 && slotStatus.missing[0] === 'guests' && currentState.type === 'hotel') {
        console.log('🔧 Applying default: guests = 2');
        currentState.slots.guests = 2;
        currentState.filledSlots.push('guests');
      }
      
      // Check again after applying defaults
      const finalSlotStatus = checkSlotCompleteness(currentState);
      
      // Prevent duplicate searches
      const currentParams = JSON.stringify(currentState.slots);
      const isDuplicate = currentState.lastSearch && 
        JSON.stringify(currentState.lastSearch.params) === currentParams &&
        (Date.now() - currentState.lastSearch.timestamp) < 30000;
      
      if (finalSlotStatus.canSearch && !isDuplicate) {
        console.log('🚀 All required slots filled - executing direct search');
        
        let toolResult: any = null;
        let searchMessage = '';
        
        if (currentState.type === 'hotel') {
          searchMessage = `Perfect! Let me search for hotels in ${currentState.slots.location} for you. This usually takes about 30-45 seconds as I compare options from multiple sources...`;
          toolResult = await searchHotels(currentState.slots);
          
          // Update last search
          currentState.lastSearch = {
            params: currentState.slots,
            timestamp: Date.now()
          };
        } else if (currentState.type === 'flight') {
          searchMessage = `Great! Searching for flights from ${currentState.slots.origin} to ${currentState.slots.destination}. This may take a minute as I check availability across airlines...`;
          toolResult = await searchFlights(currentState.slots);
          
          currentState.lastSearch = {
            params: currentState.slots,
            timestamp: Date.now()
          };
        }
        
        if (toolResult && !toolResult.error) {
          const resultCount = toolResult.results?.length || 0;
          const finalMessage = resultCount > 0 
            ? `I found ${resultCount} excellent ${currentState.type === 'hotel' ? 'hotels' : 'flights'} for you! Check them out below.\n\nWould you like to book this yourself, or would you prefer to be matched with a Goldsainte certified travel agent who can handle all the details?`
            : "I couldn't find any available options for those criteria. Try different dates or location?";
          
          return new Response(JSON.stringify({
            message: finalMessage,
            toolResults: [toolResult.forUser || toolResult],
            conversationHistory: [
              ...conversationHistory,
              { role: 'user', content: message },
              { role: 'assistant', content: finalMessage, conversationState: currentState }
            ]
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }
      } else if (!finalSlotStatus.canSearch) {
        console.log(`⏳ Missing required slots: ${finalSlotStatus.missing.join(', ')}`);
        // Continue to AI with state context
      } else if (isDuplicate) {
        console.log('⚠️ Duplicate search prevented - continuing to AI for clarification');
      }
    }
    
    // State machine for sequential questions
    if (isQuickLink && quickLinkState) {
      const { type, step, data } = quickLinkState;
      let nextStep = step;
      let nextData = { ...data };
      let shouldSearch = false;
      
      if (type === 'hotels') {
        if (step === 0) {
          // Ask for location
          nextStep = 1;
        } else if (step === 1) {
          // Got location, ask for check-in
          nextData.location = message;
          nextStep = 2;
        } else if (step === 2) {
          // Got check-in (or range) from user
          const parsed = parseDates(message);
          if (parsed.checkIn && parsed.checkOut) {
            nextData.checkIn = parsed.checkIn;
            nextData.checkOut = parsed.checkOut;
            nextStep = 4; // both provided, skip to budget
          } else {
            nextData.checkIn = parsed.checkIn || message;
            nextStep = 3;
          }
        } else if (step === 3) {
          // Got check-out (or range), ask for budget
          const parsed = parseDates(message);
          if (parsed.checkIn && !nextData.checkIn) nextData.checkIn = parsed.checkIn;
          nextData.checkOut = parsed.checkOut || message;
          nextStep = 4;
        } else if (step === 4) {
          // Got budget, search
          nextData.budget = message;
          shouldSearch = true;
        }
      } else if (type === 'flights') {
        if (step === 0) {
          // Ask for origin
          nextStep = 1;
        } else if (step === 1) {
          // Got origin, ask for destination
          nextData.origin = message;
          nextStep = 2;
        } else if (step === 2) {
          // Got destination, ask for departure date
          nextData.destination = message;
          nextStep = 3;
        } else if (step === 3) {
          // Check if both dates were provided at once (from date picker)
          const returningMatch = message.match(/^(\d{4}-\d{2}-\d{2})\s+returning\s+(\d{4}-\d{2}-\d{2})$/i);
          if (returningMatch) {
            // Both dates provided, ask for budget
            nextData.departureDate = returningMatch[1];
            nextData.returnDate = returningMatch[2];
            nextStep = 5; // Skip to budget step
          } else {
            // Just departure date provided, ask for return
            nextData.departureDate = message;
            nextStep = 4;
          }
        } else if (step === 4) {
          // Got return date or skip, ask for budget
          if (message && !message.toLowerCase().includes('one way') && !message.toLowerCase().includes('skip')) {
            nextData.returnDate = message;
          }
          nextStep = 5;
        } else if (step === 5) {
          // Got budget, search
          nextData.budget = message;
          shouldSearch = true;
        }
      } else if (type === 'restaurants') {
        if (step === 0) {
          // Ask for location
          nextStep = 1;
        } else if (step === 1) {
          // Got location, optionally ask cuisine
          nextData.location = message;
          nextStep = 2;
        } else if (step === 2) {
          // Got cuisine or skip, ask for budget
          if (message && !message.toLowerCase().includes('any') && !message.toLowerCase().includes('skip')) {
            nextData.cuisineType = message;
          }
          nextStep = 3;
        } else if (step === 3) {
          // Got budget, search
          nextData.budget = message;
          shouldSearch = true;
        }
      } else if (type === 'events') {
        if (step === 0) {
          // Ask for location
          nextStep = 1;
        } else if (step === 1) {
          // Got location, ask for budget
          nextData.location = message;
          nextStep = 2;
        } else if (step === 2) {
          // Got budget, search
          nextData.budget = message;
          shouldSearch = true;
        }
      } else if (type === 'cars') {
        if (step === 0) {
          // Ask for pickup location
          nextStep = 1;
        } else if (step === 1) {
          // Got location, ask for trip type (one-way or round-trip)
          nextData.pickupLocation = message;
          nextStep = 2;
        } else if (step === 2) {
          // Got trip type
          const isOneWay = message.toLowerCase().includes('one-way') || message.toLowerCase().includes('one way');
          nextData.tripType = isOneWay ? 'one-way' : 'round-trip';
          
          if (isOneWay) {
            // Ask for dropoff location
            nextStep = 3;
          } else {
            // Round-trip, skip to pickup date
            nextData.dropoffLocation = nextData.pickupLocation; // Same location
            nextStep = 4;
          }
        } else if (step === 3) {
          // Got dropoff location (one-way only)
          nextData.dropoffLocation = message;
          nextStep = 4;
        } else if (step === 4) {
          // Check if both dates were provided at once (from date picker)
          const returningMatch = message.match(/^(\d{4}-\d{2}-\d{2})\s+returning\s+(\d{4}-\d{2}-\d{2})$/i);
          if (returningMatch) {
            // Both dates provided, ask for budget
            nextData.pickupDate = returningMatch[1];
            nextData.returnDate = returningMatch[2];
            nextStep = 6; // Skip to budget step
          } else {
            // Just pickup date provided, ask for return
            nextData.pickupDate = message;
            nextStep = 5;
          }
        } else if (step === 5) {
          // Got return date, ask for budget
          nextData.returnDate = message;
          nextStep = 6;
        } else if (step === 6) {
          // Got budget, search
          nextData.budget = message;
          shouldSearch = true;
        }
      }
      
      // Execute search if ready
      if (shouldSearch) {
        let toolResult;
        if (type === 'hotels') {
          toolResult = await searchHotels({
            location: nextData.location,
            checkIn: nextData.checkIn,
            checkOut: nextData.checkOut,
            guests: 2
          });
        } else if (type === 'flights') {
          toolResult = await searchFlights({
            origin: nextData.origin,
            destination: nextData.destination,
            departureDate: nextData.departureDate,
            returnDate: nextData.returnDate,
            adults: 1
          });
        } else if (type === 'restaurants') {
          toolResult = await searchRestaurants({
            location: nextData.location,
            cuisineType: nextData.cuisineType
          });
        } else if (type === 'events') {
          toolResult = await searchEvents({
            location: nextData.location
          });
        } else if (type === 'cars') {
          toolResult = await searchCars({
            pickupLocation: nextData.pickupLocation,
            pickupDate: nextData.pickupDate,
            returnDate: nextData.returnDate,
            dropoffLocation: nextData.dropoffLocation
          });
        }
        
        const finalMessage = `Great! I found some options for you. Check them out below!`;
        return new Response(JSON.stringify({
          message: finalMessage,
          toolResults: [toolResult],
          conversationHistory: [...conversationHistory,
            { role: 'user', content: message },
            { role: 'assistant', content: finalMessage }
          ]
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
      
      // Generate next question
      let nextQuestion = '';
      if (type === 'hotels') {
        if (nextStep === 1) nextQuestion = "Where would you like to stay?";
        else if (nextStep === 2) nextQuestion = `Perfect! When would you like to check in to ${nextData.location}? (single date, YYYY-MM-DD)`;
        else if (nextStep === 3) nextQuestion = "And when would you like to check out? (single date, YYYY-MM-DD)";
        else if (nextStep === 4) nextQuestion = "What's your budget per night? (e.g., $100-$300)";
      } else if (type === 'flights') {
        if (nextStep === 1) nextQuestion = "Where will you be flying from?";
        else if (nextStep === 2) nextQuestion = `Great! Where would you like to fly to from ${nextData.origin}?`;
        else if (nextStep === 3) nextQuestion = "When would you like to depart?";
        else if (nextStep === 4) nextQuestion = "When would you like to return? (or say 'one way' for a one-way flight)";
        else if (nextStep === 5) nextQuestion = "What's your budget for the flight? (e.g., $500-$1500)";
      } else if (type === 'restaurants') {
        if (nextStep === 1) nextQuestion = "Which city are you looking for restaurants in?";
        else if (nextStep === 2) nextQuestion = "What type of cuisine are you interested in? (or say 'any' for all types)";
        else if (nextStep === 3) nextQuestion = "What's your budget per person? (e.g., $20-$100)";
      } else if (type === 'events') {
        if (nextStep === 1) nextQuestion = "Which city would you like to find events in?";
        else if (nextStep === 2) nextQuestion = "What's your budget per ticket? (e.g., $50-$200)";
      } else if (type === 'cars') {
        if (nextStep === 1) nextQuestion = "Where would you like to pick up the car?";
        else if (nextStep === 2) nextQuestion = `Great! Is this a one-way rental or round-trip?`;
        else if (nextStep === 3) nextQuestion = `Where would you like to drop off the car?`;
        else if (nextStep === 4) nextQuestion = `Perfect! When would you like to pick up the car in ${nextData.pickupLocation}?`;
        else if (nextStep === 5) nextQuestion = "And when would you like to return the car?";
        else if (nextStep === 6) nextQuestion = "What's your budget per day? (e.g., $50-$150)";
      }
      
      return new Response(JSON.stringify({
        message: nextQuestion,
        quickLinkState: { type, step: nextStep, data: nextData },
        toolResults: [],
        conversationHistory: [...conversationHistory,
          { role: 'user', content: message },
          { role: 'assistant', content: nextQuestion, quickLinkState: { type, step: nextStep, data: nextData } }
        ]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Phase 3: Smart query detection - bypass AI for simple direct searches
    const simplifiedMessage = message.toLowerCase().trim();
    
    // Hotel search patterns
    const hotelPattern = /(?:find|search|show|get|book|need|looking for|look for)\s+(?:me\s+)?(?:hotels?|accommodations?|places to stay|rooms?)\s+(?:in|at|near)\s+([a-zA-Z\s,]+?)(?:\s+(?:from|for|on|between)\s+([\d\-\/]+))?(?:\s+to\s+([\d\-\/]+))?/i;
    const hotelMatch = simplifiedMessage.match(hotelPattern);
    
    if (hotelMatch && conversationHistory.length < 2) {
      const location = hotelMatch[1].trim();
      const dates = parseDates(message);
      
      // If we have location and dates, search immediately
      if (location && dates.checkIn && dates.checkOut) {
        console.log('[Fast Path] Direct hotel search detected:', { location, ...dates });
        const toolResult = await searchHotels({
          location,
          checkIn: dates.checkIn,
          checkOut: dates.checkOut,
          guests: 2
        });
        
        return new Response(JSON.stringify({
          message: `Here are hotels in ${location} for your dates:`,
          toolResults: [toolResult],
          conversationHistory: [...conversationHistory,
            { role: 'user', content: message },
            { role: 'assistant', content: `Here are hotels in ${location} for your dates:` }
          ]
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
    }

    // Conversational approach for complex queries

    // Define tools for the AI agent
    const tools = [
      {
        type: "function",
        function: {
          name: "search_packages",
          description: "Search for complete travel packages that include flights, hotels, and car rentals together. Use this when users ask about package deals, vacation packages, or want to book flights + hotels + cars together for a complete trip.",
          parameters: {
            type: "object",
            properties: {
              origin: {
                type: "string",
                description: "Origin city or airport for flights"
              },
              destination: {
                type: "string",
                description: "Destination city for the entire package"
              },
              departureDate: {
                type: "string",
                description: "Trip start date in YYYY-MM-DD format"
              },
              returnDate: {
                type: "string",
                description: "Trip end date in YYYY-MM-DD format"
              },
              travelers: {
                type: "number",
                description: "Number of travelers (adults)"
              },
              includeHotel: {
                type: "boolean",
                description: "Whether to include hotel in package (default true)"
              },
              includeCar: {
                type: "boolean",
                description: "Whether to include car rental in package (default true)"
              },
              budget: {
                type: "string",
                description: "Total budget for entire package (e.g., '$2000-$5000')"
              }
            },
            required: ["origin", "destination", "departureDate", "returnDate", "travelers"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "search_hotels",
          description: "Search for hotels in a specific location. IMPORTANT: You must have location, check-in date (YYYY-MM-DD), and check-out date (YYYY-MM-DD) before calling this tool. Ask the user for these details if not provided. You can also filter by price, rating, amenities, and sort by different criteria.",
          parameters: {
            type: "object",
            properties: {
              location: {
                type: "string",
                description: "The city, region, or destination to search for hotels"
              },
              checkIn: {
                type: "string",
                description: "Check-in date in YYYY-MM-DD format"
              },
              checkOut: {
                type: "string",
                description: "Check-out date in YYYY-MM-DD format"
              },
              guests: {
                type: "number",
                description: "Number of guests"
              },
              sortBy: {
                type: "string",
                enum: ["popularity", "price", "distance", "review_score"],
                description: "How to sort results: popularity (most booked), price (lowest first), distance (closest to center), review_score (highest rated)"
              },
              minRating: {
                type: "number",
                description: "Minimum guest review score (0-10, e.g., 8 for excellent hotels)"
              },
              maxPrice: {
                type: "number",
                description: "Maximum price per night in USD"
              },
              amenities: {
                type: "array",
                items: { type: "string" },
                description: "Required amenities like 'wifi', 'pool', 'parking', 'gym', 'restaurant', 'spa'"
              }
            },
            required: ["location", "checkIn", "checkOut"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "search_flights",
          description: "Search for flights between two cities. Use this when users ask about flights, airfare, or flying from one place to another. You can specify one-way or round-trip, cabin class, and whether direct flights only.",
          parameters: {
            type: "object",
            properties: {
              origin: {
                type: "string",
                description: "Origin city or airport (e.g., 'New York', 'JFK', 'London')"
              },
              destination: {
                type: "string",
                description: "Destination city or airport (e.g., 'Paris', 'CDG', 'Tokyo')"
              },
              departureDate: {
                type: "string",
                description: "Departure date in YYYY-MM-DD format"
              },
              returnDate: {
                type: "string",
                description: "Return date in YYYY-MM-DD format (optional, only for round-trip flights)"
              },
              adults: {
                type: "number",
                description: "Number of adult passengers (default 1)"
              },
              travelClass: {
                type: "string",
                enum: ["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"],
                description: "Cabin class (default ECONOMY)"
              },
              nonStop: {
                type: "boolean",
                description: "Whether to show only direct flights (default false)"
              },
              sortBy: {
                type: "string",
                enum: ["best", "price", "duration", "departure_early", "departure_late"],
                description: "How to sort flight results: best (Amadeus recommendation), price (cheapest first), duration (shortest first), departure_early (earliest departure), departure_late (latest departure). Default is 'best'."
              }
            },
            required: ["origin", "destination", "departureDate"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "search_activities",
          description: "Search for tours, activities, and things to do using Amadeus API. Use this when users ask about activities, tours, things to do, attractions, or experiences in a location.",
          parameters: {
            type: "object",
            properties: {
              location: {
                type: "string",
                description: "City or destination name (e.g., 'Barcelona', 'New York', 'Tokyo')"
              },
              latitude: {
                type: "number",
                description: "Latitude coordinate of the search location (optional)"
              },
              longitude: {
                type: "number",
                description: "Longitude coordinate of the search location (optional)"
              },
              radius: {
                type: "number",
                description: "Search radius in kilometers (default 5)"
              },
              categories: {
                type: "array",
                items: { type: "string" },
                description: "Activity categories to filter by (e.g., 'SIGHTSEEING', 'ADVENTURE', 'FOOD_AND_DRINK', 'WATER_SPORTS')"
              }
            },
            required: ["location"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "search_events",
          description: "Search for events, concerts, shows, and entertainment using Ticketmaster. Use this when users ask about events, concerts, shows, performances, or things happening in a city.",
          parameters: {
            type: "object",
            properties: {
              city: {
                type: "string",
                description: "City name to search for events (e.g., 'New York', 'Los Angeles', 'London')"
              },
              keyword: {
                type: "string",
                description: "Keyword to search for (e.g., artist name, event type, venue)"
              },
              startDate: {
                type: "string",
                description: "Start date in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)"
              },
              endDate: {
                type: "string",
                description: "End date in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)"
              },
              classificationName: {
                type: "string",
                description: "Event classification (e.g., 'Music', 'Sports', 'Arts & Theatre', 'Family')"
              }
            },
            required: ["city"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "check_visa_requirements",
          description: "Check visa requirements for travel between two countries. Use this when users ask about visa requirements, travel documents needed, or whether they need a visa to visit a country. Provide country names or ISO codes.",
          parameters: {
            type: "object",
            properties: {
              fromCountry: {
                type: "string",
                description: "Origin country name or ISO code (e.g., 'United States', 'USA', 'US')"
              },
              toCountry: {
                type: "string",
                description: "Destination country name or ISO code (e.g., 'France', 'FRA', 'FR')"
              }
            },
            required: ["fromCountry", "toCountry"]
          }
        }
      }
    ];

    const locationInfo = userLocation 
      ? `\n\nIMPORTANT: The user's current location is available. When they ask for restaurants, hotels, or things "near me" or "near my current location", ask them to specify their city or use context clues to determine their city. NEVER ask for or mention latitude, longitude, or GPS coordinates - only use city names.`
      : '';

    // Make conversational approach the DEFAULT for all interactions
    const conversationalBehavior = `

CRITICAL CONVERSATIONAL BEHAVIOR - YOUR PRIMARY MODE:
You are a thoughtful travel advisor who guides users through planning their trips by asking smart, leading questions. Think of yourself as a luxury travel concierge having a natural conversation.

🎯 AVAILABLE SERVICES:
You can help users search for:
- ✈️ **Flights** - Search flights between cities (Amadeus)
- 🏨 **Hotels** - Find and compare hotels (Amadeus)
- 🎭 **Activities** - Discover tours, attractions, and experiences (Amadeus)
- 🎫 **Events & Concerts** - Find live events, concerts, shows, and performances (Ticketmaster)

You CANNOT help with:
- Restaurants (not available)
- Car rentals (not available)

If users ask for restaurants or cars, politely explain these services are not currently available and suggest they explore hotels, flights, activities, or events instead.

🎯 CONVERSATION STRATEGY:
1. **Understand the Intent First**: When a user mentions travel, ask clarifying questions to understand:
   - What type of trip? (vacation, business, special occasion, weekend getaway)
   - Who's traveling? (solo, couple, family, group)
   - What's the vibe they're going for? (relaxation, adventure, cultural, luxury, budget)

2. **Ask Leading Questions**: Guide them naturally through the planning process:
   - "What kind of experience are you looking for?"
   - "Is this for a special occasion?"
   - "What's most important to you on this trip?"
   - "Are you flexible with dates, or do you have specific dates in mind?"
   - "What's your ideal budget range?"

3. **Build Context Before Searching**: Gather key information through conversation:
   - For Hotels: destination → dates → budget → preferences (amenities, neighborhood, style)
   - For Flights: purpose of trip → origin → destination → dates → flexibility → budget
   - For Activities: destination → interests → date range (optional)

4. **Be Adaptive**: 
   - If they give you everything upfront, acknowledge and search immediately
   - If they're vague, ask gentle probing questions
   - If they seem decisive, move faster
   - If they're exploring, slow down and help them discover

5. **Natural Follow-ups**: After showing results, ask intelligent next questions:
   - "Did any of these catch your eye?"
   - "Would you like me to adjust the budget range?"
   - "Are you looking for a specific neighborhood or area?"
   - "Should I show you options with different dates?"

QUESTION PATTERNS (Use these naturally, not as a rigid script):

**When they mention a trip generally:**
- "That sounds exciting! Where are you thinking of going?"
- "What's drawing you to [destination]?"
- "Is this trip for leisure, business, or something special?"

**When gathering dates:**
- "Do you have specific dates in mind, or are you flexible?"
- "How long are you planning to stay?"
- "When were you hoping to travel?"

**When understanding budget:**
- "What kind of budget are you working with?"
- "Are you looking for luxury, mid-range, or budget-friendly options?"
- "What's your comfort zone for [hotels/flights/dining]?"

**When exploring preferences:**
- "What matters most to you? Location, price, amenities, or something else?"
- "Any must-haves for this trip?"
- "Is there anything you'd like to avoid?"

CRITICAL RULES:
- Ask ONE thoughtful question at a time (never a list of bullet points)
- Listen to their answers and build on them naturally
- Use their language and tone (formal vs casual)
- Show enthusiasm and genuine interest
- Don't rush to search - get the full picture first
- BUT if they give you clear criteria upfront, search immediately
- After showing results, continue the conversation naturally

ONLY search when you have enough information to provide relevant results. It's better to ask one more question than to show irrelevant results.

🏨 HOTEL SEARCH QUALIFICATION PROTOCOL (MANDATORY):
Before calling search_hotels, you MUST collect these details through conversation:

**Required Information:**
1. **Destination**: "What city or area are you looking to stay in?"
   - Optional follow-up: "Do you want to be near a specific landmark, airport, or neighborhood?"

2. **Check-in / Check-out Dates**: "What are your check-in and check-out dates?"
   - If not provided: "When would you like to check in and check out?"
   - Accept formats: "november 10-14", "2025-11-10 to 2025-11-14", "Nov 10th-14th"
   - ALWAYS convert to YYYY-MM-DD before calling search_hotels

3. **Number of Guests**: "How many people will be staying?"
   - Optional: "Do you need more than one room?"

**Optional but Helpful:**
4. **Budget Range**: "Do you have a nightly budget in mind?"
   - If skipped: Use mid-range estimate ($150-250/night) as default filter after showing results

5. **Preferences** (refine after initial results):
   - "Do you prefer a certain star rating or brand?"
   - "Would you like free breakfast, a pool, or pet-friendly options?"

✅ **Minimum Required to Call search_hotels:**
- Destination ✓
- Check-in date (YYYY-MM-DD) ✓  
- Check-out date (YYYY-MM-DD) ✓
- Guests (default to 2 if not mentioned)

❌ **NEVER call search_hotels without:**
- Valid check-in and check-out dates in YYYY-MM-DD format
- Future dates (not in the past)

**Example Conversation Flow:**
User: "I need a hotel in Miami"
You: "Great choice! When are you planning to visit Miami?"
User: "november 10-14"
You: "Perfect! How many people will be staying?"
User: "2 people"
You: [Now call search_hotels with location="Miami", checkIn="2025-11-10", checkOut="2025-11-14", guests=2]

SEARCH TIMING EXPECTATIONS:
When you call a search tool, ALWAYS inform the user about expected wait time:
- Hotels: "Let me search for hotels in [location] for you. This usually takes about 30-45 seconds as I compare options from multiple sources..."
- Flights: "Searching for flights now. This may take a minute as I check availability across airlines..."
- Activities: "Finding activities in [location]... this should take about 15-20 seconds..."

This sets proper expectations and prevents user frustration during API calls.

🎯 SMART PARAMETER COLLECTION (CRITICAL):
The system automatically extracts and tracks parameters from conversation. Your role is to ask ONLY for missing information:

CRITICAL RULES:
1. **Acknowledge information already provided** before asking for more
2. **Ask for ONE missing parameter at a time** (never list multiple questions)
3. **Be context-aware** - if user says "hotel in Paris next weekend", extract all three pieces of info
4. **If user provides complete details upfront**, confirm and search immediately

Parameter Requirements by Search Type:
- **Hotels**: location + check-in date + check-out date (guests defaults to 2)
- **Flights**: origin + destination + departure date (return date for round-trip)
- **Activities/Events**: location (dates optional)

Example Good Flow:
User: "Find me a hotel in Paris next weekend"
You: "Perfect! I can see you want Paris from November 1-3. How many people will be staying?"

Example Bad Flow (DON'T DO THIS):
User: "Find me a hotel in Paris next weekend"
You: "Where would you like to stay?" ❌ (already said Paris)
You: "What are your dates?" ❌ (already said next weekend)

RESULT REFINEMENT PROTOCOL:
When users ask to adjust search parameters AFTER seeing results:
- "show me cheaper options" → Call search again with maxPrice filter
- "different dates" → Call search again with new dates
- "tell me more about #3" → Answer from EXISTING results, DON'T re-search
- "which one is best?" → Answer from EXISTING results, DON'T re-search
`;

    const messages = [
      {
        role: "system",
        content: `You are Goldsainte AI, a travel assistant. Help users find hotels, flights, restaurants, events, and plan trips.${locationInfo}${userContext}

KEY RULES:
- Ask ONE clear question at a time
- Search when you have enough info (location + dates for hotels/flights)
- Use natural, conversational responses
- Apply user preferences when available
${userPreferences && usePreferences ? '- Filter searches by their saved preferences (price, rating, amenities)' : ''}

🍽️ RESTAURANT RESERVATIONS:
When showing restaurant results or when users ask about making reservations:
1. Explain that reservations can be made through Google Reservations
2. Let them know they can click "Make Reservation" on any restaurant card to be taken to Google where they can:
   - View real-time availability
   - Make instant reservations
   - See reviews and menus
   - Get directions
3. DO NOT collect reservation details (date, time, party size) in the chat
4. DO NOT try to create internal bookings for restaurants
5. Simply guide them to use the "Make Reservation" button on the restaurant cards

CONTEXT AWARENESS: When you've just asked "What city are you in?" and the user responds with ONLY a city name (like "New York", "Paris", "London"), IMMEDIATELY call the appropriate search tool (search_hotels or search_restaurants) with that city. Don't ask for confirmation - just search!

LOCATION RULES:
- NEVER ask users for latitude, longitude, GPS coordinates, or precise location data
- ALWAYS ask for city names instead (e.g., "What city are you in?" not "What's your latitude and longitude?")
- When users say "near me" or "current location", ask them for their city name
- Use city names in all search queries

EXCEPTION - FLIGHTS REQUIRE ORIGIN: For flight searches, if the user does NOT specify where they're flying FROM, you MUST ask them for the origin city before searching. Do not assume or guess the origin location. For example, if they say "flights to Paris" or "fly to London", ask "Where will you be flying from?" before calling search_flights.

🔥 CRITICAL CONTEXT AWARENESS - UNDERSTAND FOLLOW-UP QUESTIONS:
When users ask follow-up questions like "what hotel is this?", "which airline?", "show me more details", they are referring to the results YOU JUST SHOWED them in the conversation history.
DO NOT re-search or call tools again. Instead:
1. Look at the PREVIOUS message in the conversation where you showed results
2. Extract the relevant details from those results (hotel names, flight info, etc.)
3. Answer based on that context
4. If they want to see specific hotel details, describe what's available in the package you already showed

For example:
- User: "what hotel is this?" → Look at the package you just showed, identify the hotel name(s), and describe them
- User: "which flight?" → Reference the flight details from the package you just presented
- User: "tell me more about the hotel" → Provide details from the hotel information already in the conversation

NEVER call search_packages or other search tools again for context questions - use the conversation history!

🔥 CRITICAL BOOKING & AGENT MATCHING PROTOCOL - MANDATORY FOR ALL RESULTS:
After showing ANY search results (packages, flights, hotels, restaurants, or events), you MUST ALWAYS ask the user about their booking preference. This is a core feature of the Goldsainte platform and CANNOT BE SKIPPED.

🎯 GROUP BOOKING PAYMENT COORDINATION (FOR 3+ TRAVELERS):
When showing results for 3 or more travelers, you MUST ask TWO questions in sequence:

**Question 1 - Booking Method (ALWAYS ASK):**
"Before we proceed with booking, I need to know:

**How would you like to handle this booking?**
1. 🤝 **Book with a Goldsainte Certified Travel Agent** - Get personalized service, expert coordination, exclusive perks, and seamless group management
2. 💻 **Book it yourself** - Complete the booking directly through our platform

Which option works best for you?"

**Question 2 - Payment Coordination (ONLY IF 3+ TRAVELERS):**
After they choose their booking method, ask:

"Since you're booking for [NUMBER] people, let's coordinate the payment:

**How will the payment be split?**
1. 💳 **One person pays total** - The entire cost ([TOTAL PRICE]) is paid by one person upfront
2. 👥 **Each person pays their share** - Everyone pays their individual portion ([PER-PERSON PRICE] per person)
3. 🔄 **Custom split** - We'll work out a custom payment arrangement

Please let me know your preference, and I'll guide you through the appropriate booking flow. If everyone is paying separately, I'll explain how each traveler will be notified and able to complete their payment portion."

PAYMENT COORDINATION DETAILS TO EXPLAIN (if asked or if they choose option 2):
- Each traveler will receive a unique payment link via email
- They'll see the booking details and their individual payment amount
- The booking is confirmed once all payments are received
- Everyone gets confirmation emails and booking details
- If working with an agent, they'll coordinate all payment collection seamlessly

REQUIRED FOLLOW-UP FOR 1-2 TRAVELERS (Standard booking preference):
"Would you like to book this yourself, or would you prefer to be matched with a Goldsainte certified travel agent who can handle all the details and add personalized touches to your trip?"

IMPORTANT VARIATIONS BY RESULT TYPE:
- For packages: "These packages look amazing! First, how would you like to book - yourself or with a certified Goldsainte travel agent who can customize everything and add exclusive perks?"
- For flights: "I found excellent flight options! Would you like to book directly, or have a Goldsainte certified travel agent secure the booking and potentially find you upgrades?"
- For hotels: "Here are wonderful hotels! Prefer to book yourself, or work with a Goldsainte travel agent who can secure upgrades and handle all details?"
- For restaurants: "These restaurants look amazing! Make the reservation yourself, or have a Goldsainte travel agent arrange it along with other dining experiences?"
- For events: "Great events! Book tickets yourself, or have a Goldsainte travel agent secure them and plan the perfect evening around it?"

TIMING: Ask these questions in your FINAL RESPONSE after tool results are returned. Include them in your text response AFTER describing the results. This is NON-NEGOTIABLE.

WHY THIS MATTERS: Goldsainte's entire platform is built on providing travelers with BOTH AI-powered self-service booking AND access to certified luxury travel agents. For groups, coordinating payments properly is essential to a smooth booking experience. Every result presentation MUST include this value proposition.

PACKAGE PRICING CLARITY:
When presenting package prices, ALWAYS be crystal clear about pricing structure:
- State both per-person price AND total price for all travelers
- Example: "$257.23 per person, which is $1,028.93 total for all 4 travelers"
- Make it obvious whether they're paying per person or total
- Highlight any savings vs booking separately

VISA REQUIREMENTS PROTOCOL:
When you provide visa information using check_visa_requirements tool:
1. First, provide the visa requirement details clearly, including:
   - Visa status (required, visa-free, visa on arrival, eVisa)
   - Duration of stay allowed
   - Passport validity requirements
   - IMPORTANT: Explain visa fee considerations:
     * Fees vary by destination country
     * Different visa types (tourism, business, study, work) have different fees
     * Petition-based visas (like work visas) may have different fee structures
     * Expedited processing typically costs more
     * Additional charges may apply (SEVIS fees, service center fees)
     * User should verify exact fees on official embassy/consulate website
2. If the destination country REQUIRES a visa (not visa-free, not visa on arrival), ALWAYS ask: "Would you like Goldsainte to assist you with your visa application? Our team can handle the entire process for you, including helping you understand the exact fees and requirements."
3. If they say yes or express interest, inform them: "Great! To get started with your visa application, I'll need to collect some information. Please provide your contact details and travel information."
4. DO NOT collect information in the chat - the interface will show a form for them to fill out.

Smart Defaults (Use only when user provides complete information upfront):
- Hotels: If no dates given but everything else is clear → ask about dates
- Flights: If origin is missing → ASK where they're flying from (DO NOT ASSUME)
- Flights: If they say "round trip" → ask about return date or suggest typical duration
- Guest/passenger count: Only assume if they've given all other details (1 adult for flights, 2 guests for hotels)
- If they say "best" or "top" → confirm budget range, then use sortBy "review_score" with minRating 8
- If they say "cheap" or "budget" → confirm their budget range, then sortBy "price"
- For cabin class: default to ECONOMY unless specified
- For restaurants: if city not mentioned, ask conversationally

CALCULATING DATES: When using "tomorrow", calculate the actual date. For example, if today is 2025-09-30, tomorrow is 2025-10-01. For "next week" add 7 days.

🗓️ CRITICAL DATE HANDLING RULES:
**Current System Date: October 25, 2025**

When users provide dates in natural language, YOU MUST convert them to YYYY-MM-DD format before calling search tools:

1. **Year Inference Logic** (NEVER use past dates):
   - October, November, December dates → Use 2025
   - January through September dates → Use 2026 (next year)
   - If user explicitly provides a year, use that year
   - NEVER infer dates in 2024 or earlier

2. **Natural Language Examples:**
   - "november 10-14" → checkIn: "2025-11-10", checkOut: "2025-11-14"
   - "nov 10th-14th" → checkIn: "2025-11-10", checkOut: "2025-11-14"
   - "december 1-5" → checkIn: "2025-12-01", checkOut: "2025-12-05"
   - "january 15-20" → checkIn: "2026-01-15", checkOut: "2026-01-20"
   - "next month" → Calculate based on current date (e.g., November 2025)

3. **Format Requirements:**
   - ALL dates passed to search tools MUST be in YYYY-MM-DD format
   - Check-out date MUST be after check-in date
   - Dates MUST be in the future (not before October 25, 2025)

4. **Error Prevention:**
   - Double-check year inference before calling search tools
   - If unsure about dates, ask the user to clarify
   - Never pass dates in MM/DD/YYYY or natural language format to tools

**Examples of CORRECT conversions:**
- User: "book hotel in Miami november 10-14" → Call search_hotels with checkIn: "2025-11-10", checkOut: "2025-11-14"
- User: "flights to Paris in january" → Ask for specific dates, then use 2026 for January
- User: "hotel next week" → Calculate the actual dates and use YYYY-MM-DD format

EXAMPLE CONVERSATIONAL FLOWS (Follow this natural pattern):

Example 1 - User gives complete information:
User: "Show me flights from New York to Paris on March 15th"
YOU: *They gave complete info, search immediately* → call search_flights with origin="New York", destination="Paris", departureDate="2025-03-15", adults=1
Response: "Great! Let me find flights from New York to Paris for March 15th." [shows results] "Would you like to see round-trip options, or are you looking for one-way?"

Example 2 - User gives partial information:
User: "I need a hotel in Tokyo"  
YOU: "Perfect! When are you planning to visit Tokyo?"
User: "Next week for 3 nights"
YOU: "And what's your budget per night? Any specific amenities you're looking for?"
User: "$200-300, needs to have a pool"
YOU: *Now search* → call search_hotels with appropriate params

Example 3 - User is exploring:
User: "I want to plan a trip to Europe"
YOU: "How exciting! Which countries or cities in Europe are you most interested in?"
User: "Maybe Paris or Rome"
YOU: "Both amazing choices! Is this for a special occasion, or just a vacation? That might help me recommend which one."
User: "Anniversary trip"
YOU: "How romantic! For an anniversary, I'd personally recommend Paris for the ambiance. When are you thinking of going?"
[Continue conversation naturally before searching]

Example 4 - Quick decision maker:
User: "Best hotels in Miami this weekend under $300"
YOU: *They're decisive and gave criteria* → search immediately with sortBy="review_score", maxPrice=300
Response: "I'll find the best-rated hotels in Miami for this weekend under $300!" [shows results]

PRESENTING RESULTS - Keep it conversational:
When you use search tools and get results, DO NOT list out all the details in text. The interface shows beautiful visual cards automatically. Instead, give a brief, enthusiastic response that continues the conversation:

✅ GOOD responses after showing results:
- "I found some amazing options for you! Check out these hotels - they all have great reviews."
- "Here are some excellent flights. The 10am departure looks perfect for your schedule. What do you think?"
- "These restaurants are all highly rated! The Italian place on 5th Avenue looks incredible. Any catch your eye?"

Then naturally ask follow-up questions:
- "Would you like me to adjust the price range?"
- "Should I look for different dates?"
- "Are there any specific amenities you need?"
- "Want to see options in a different neighborhood?"

Always show results first with minimal text, then continue the conversation naturally. Be a helpful guide, not just a search engine.

Always show results first with minimal text, ask questions later. Be conversational but let the visual interface do the heavy lifting.`
      },
      ...conversationHistory,
      {
        role: "user",
        content: message
      }
    ];

    console.log('Calling Lovable AI Gateway (Gemini)...');

    const aiResponse = await fetch(LOVABLE_AI_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        tools,
        tool_choice: 'auto',
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response:', JSON.stringify(aiData, null, 2));

    const assistantMessage = aiData.choices[0].message;
    
    // Check if AI wants to use tools
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      console.log('AI requested tool calls:', assistantMessage.tool_calls.length);
      
      const toolResults: Array<{
        tool_call_id: string;
        function_name: string;
        result: any;
      }> = [];
      
      for (const toolCall of assistantMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
        
        console.log(`Executing tool: ${functionName}`, functionArgs);
        
        let toolResult;
        
        if (functionName === 'search_packages') {
          const fullResult = await searchPackages(functionArgs);
          // Trim data for AI but keep full data for user
          toolResult = {
            forAI: trimPackageDataForAI(fullResult),
            forUser: fullResult
          };
        } else if (functionName === 'search_hotels') {
          toolResult = await searchHotels(functionArgs);
        } else if (functionName === 'search_flights') {
          toolResult = await searchFlights(functionArgs);
        } else if (functionName === 'search_activities') {
          // Call amadeus-search-tours edge function
          const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
          const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
          
          const response = await fetch(`${SUPABASE_URL}/functions/v1/amadeus-search-tours`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(functionArgs)
          });
          
          if (!response.ok) {
            console.error('Failed to fetch activities:', response.status);
            toolResult = { error: 'Failed to fetch activities', results: [] };
          } else {
            const data = await response.json();
            toolResult = { 
              type: 'activities',
              results: data.activities?.slice(0, 15) || [],
              location: functionArgs.location
            };
          }
        } else if (functionName === 'search_events') {
          toolResult = await searchEvents(functionArgs);
        } else if (functionName === 'check_visa_requirements') {
          toolResult = await checkVisaRequirements(functionArgs);
        }
        
        toolResults.push({
          tool_call_id: toolCall.id,
          function_name: functionName,
          result: toolResult
        });
      }

      // Send results back to AI for final response
      const finalMessages = [
        ...messages,
        assistantMessage,
        ...toolResults.map(tr => ({
          role: "tool",
          tool_call_id: tr.tool_call_id,
          // Use trimmed data for AI if available, otherwise full result
          content: JSON.stringify(tr.result.forAI || tr.result)
        }))
      ];

      console.log('Sending tool results back to AI for final response...');
      console.log('Tool results count:', toolResults.length);
      const messageSize = JSON.stringify(finalMessages).length;
      console.log('Total message size:', messageSize);
      
      // If message is too large, log a warning
      if (messageSize > 500000) {
        console.warn('WARNING: Message size exceeds 500KB, may cause API issues');
      }

      try {
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout

        const finalResponse = await fetch(LOVABLE_AI_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: finalMessages,
            max_completion_tokens: 500, // Limit response size
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!finalResponse.ok) {
          const errorText = await finalResponse.text();
          console.error('Final AI response error:', finalResponse.status, errorText);
          throw new Error(`AI response failed: ${finalResponse.status}`);
        }

        const finalData = await finalResponse.json();
        console.log('Final AI response received successfully');
        const finalMessage = finalData.choices[0].message.content;

        return new Response(JSON.stringify({
          message: finalMessage,
          // Return full data to user (forUser if available, otherwise full result)
          toolResults: toolResults.map(tr => tr.result.forUser || tr.result),
          conversationHistory: [...conversationHistory, 
            { role: 'user', content: message },
            { role: 'assistant', content: finalMessage }
          ]
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      } catch (finalError: any) {
        console.error('Error getting final AI response:', finalError);
        
        // Check if tool results actually contain any data
        const hasResults = toolResults.some(tr => {
          const result = tr.result.forUser || tr.result;
          if (!result) return false;
          
          // Check if results array has items
          if (Array.isArray(result.results) && result.results.length > 0) return true;
          
          // Check package results
          if (result.type === 'package') {
            return (result.flights?.length > 0) || 
                   (result.hotels?.length > 0) || 
                   (result.cars?.length > 0);
          }
          
          // Check visa or other info results
          if (result.information || result.requirement) return true;
          
          return false;
        });
        
        const fallbackMessage = hasResults
          ? "I found some options for you! Check them out below."
          : "I couldn't find any available options for those dates and location. This could be because:\n\n• The destination doesn't have an airport (like Zermatt - try searching for nearby cities like Geneva or Zurich)\n• No availability for the selected dates\n• The search parameters are too specific\n\nWould you like to try different dates or a nearby city?";

        return new Response(JSON.stringify({
          message: fallbackMessage,
          toolResults: toolResults.map(tr => tr.result.forUser || tr.result),
          conversationHistory: [...conversationHistory, 
            { role: 'user', content: message },
            { role: 'assistant', content: fallbackMessage }
          ]
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
    }

    // No tool calls - return conversational response
    return new Response(JSON.stringify({
      message: assistantMessage.content,
      toolResults: [],
      conversationHistory: [...conversationHistory,
        { role: 'user', content: message },
        { role: 'assistant', content: assistantMessage.content }
      ]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in travel-ai-agent:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

