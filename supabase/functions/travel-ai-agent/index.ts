import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

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
    if (fullNames.some(name => searchLocation.includes(name))) {
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

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const BOOKING_API_KEY = Deno.env.get('BOOKING_API_KEY');
    
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }
    if (!BOOKING_API_KEY) {
      throw new Error('BOOKING_API_KEY not configured');
    }

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

    // QUICK LINK STATE MACHINE (hotels): enforce one-question-at-a-time flow
    // Only use sequential questions if user has NO preferences OR preferences are disabled
    if (isQuickLink && quickLinkType === 'hotels' && (!userPreferences || !usePreferences)) {
      // Combine history with current user message for parsing
      const hist = Array.isArray(conversationHistory) ? conversationHistory.slice() : [];
      if (message) hist.push({ role: 'user', content: String(message) });

      const getLastUserMessages = () => hist.filter((m: any) => m.role === 'user').map((m: any) => m.content);

      const extractCity = (): string | null => {
        const msgs = getLastUserMessages().slice().reverse();
        for (const m of msgs) {
          const txt = (m || '').trim();
          if (!txt) continue;
          const lower = txt.toLowerCase();
          if (lower.startsWith('dates:') || lower.startsWith('budget:')) continue;
          if (/[0-9$]/.test(lower)) continue;
          if (lower.includes('looking for') || lower.includes('hotels') || lower.includes('help')) continue;
          if (txt.split(/\s+/).length <= 6) {
            return txt;
          }
        }
        return null;
      };

      const extractDates = (): { checkIn: string; checkOut: string } | null => {
        const msgs = getLastUserMessages().slice().reverse();
        const dateRegexAll = /\b20\d{2}-\d{2}-\d{2}\b/g;
        for (const m of msgs) {
          const matches = (m || '').match(dateRegexAll) || [];
          if (matches.length >= 2) {
            return { checkIn: matches[0], checkOut: matches[1] };
          }
          const lower = (m || '').toLowerCase();
          const fromTo = lower.match(/(20\d{2}-\d{2}-\d{2}).*?(20\d{2}-\d{2}-\d{2})/);
          if (fromTo) {
            return { checkIn: fromTo[1], checkOut: fromTo[2] };
          }
        }
        return null;
      };

      const extractBudget = (): number | null => {
        const msgs = getLastUserMessages().slice().reverse();
        for (const m of msgs) {
          const budgetMatch = (m || '').match(/budget[:\s]*\$?(\d+)/i);
          if (budgetMatch) return Number(budgetMatch[1]);
          const dollar = (m || '').match(/\$(\d{1,6})/);
          if (dollar) return Number(dollar[1]);
        }
        return null;
      };

      const city = extractCity();
      const dates = extractDates();
      const budget = extractBudget();

      if (!city) {
        const assistant = 'What city are you looking to stay in?';
        return new Response(JSON.stringify({
          message: assistant,
          toolResults: [],
          conversationHistory: [...hist, { role: 'assistant', content: assistant }]
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      }
      if (!dates) {
        const assistant = 'When are you planning to stay?';
        return new Response(JSON.stringify({
          message: assistant,
          toolResults: [],
          conversationHistory: [...hist, { role: 'assistant', content: assistant }]
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      }
      if (budget == null) {
        const assistant = "What's your budget per night?";
        return new Response(JSON.stringify({
          message: assistant,
          toolResults: [],
          conversationHistory: [...hist, { role: 'assistant', content: assistant }]
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      }

      // We have all required info - perform the hotel search
      const searchParams: any = {
        location: city,
        checkIn: dates.checkIn,
        checkOut: dates.checkOut,
        guests: 2,
        maxPrice: budget,
        sortBy: 'review_score'
      };
      
      const result = await searchHotels(searchParams, BOOKING_API_KEY);

      // Check if search had an error
      if (result.error || !result.results || result.results.length === 0) {
        const errorMessage = result.error || `I couldn't find hotels in ${city} for those dates. Could you try a different city or dates?`;
        return new Response(JSON.stringify({
          message: errorMessage,
          toolResults: [result],
          conversationHistory: [...hist, { role: 'assistant', content: errorMessage }]
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      }

      const finalMessage = `Perfect! I found ${result.results.length} great hotel${result.results.length !== 1 ? 's' : ''} in ${city}. Check out the options below!`;
      return new Response(JSON.stringify({
        message: finalMessage,
        toolResults: [result],
        conversationHistory: [...hist, { role: 'assistant', content: finalMessage }]
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    // QUICK LINK STATE MACHINE (flights): enforce one-question-at-a-time flow
    if (isQuickLink && quickLinkType === 'flights' && (!userPreferences || !usePreferences)) {
      const hist = Array.isArray(conversationHistory) ? conversationHistory.slice() : [];
      if (message) hist.push({ role: 'user', content: String(message) });

      const getLastUserMessages = () => hist.filter((m: any) => m.role === 'user').map((m: any) => m.content);

      const extractOrigin = (): string | null => {
        const msgs = getLastUserMessages();
        for (let i = msgs.length - 1; i >= 0; i--) {
          const txt = (msgs[i] || '').trim();
          if (!txt) continue;
          const lower = txt.toLowerCase();
          if (lower.startsWith('from:') || lower.includes('flying from')) {
            return txt.replace(/^from:\s*/i, '').replace(/flying from\s*/i, '').trim();
          }
          if (i === msgs.length - 1 && txt.split(/\s+/).length <= 4 && !/[0-9$]/.test(txt)) {
            return txt;
          }
        }
        return null;
      };

      const extractDestination = (): string | null => {
        const msgs = getLastUserMessages();
        for (let i = msgs.length - 1; i >= 0; i--) {
          const txt = (msgs[i] || '').trim();
          if (!txt) continue;
          const lower = txt.toLowerCase();
          if (lower.startsWith('to:') || lower.includes('going to')) {
            return txt.replace(/^to:\s*/i, '').replace(/going to\s*/i, '').trim();
          }
          if (i === msgs.length - 1 && msgs.length > 1 && txt.split(/\s+/).length <= 4 && !/[0-9$]/.test(txt)) {
            return txt;
          }
        }
        return null;
      };

      const extractDate = (): string | null => {
        const msgs = getLastUserMessages();
        const dateRegex = /\b20\d{2}-\d{2}-\d{2}\b/;
        for (let i = msgs.length - 1; i >= 0; i--) {
          const match = (msgs[i] || '').match(dateRegex);
          if (match) return match[0];
        }
        return null;
      };

      const extractBudget = (): number | null => {
        const msgs = getLastUserMessages().slice().reverse();
        for (const m of msgs) {
          const budgetMatch = (m || '').match(/budget[:\s]*\$?(\d+)/i);
          if (budgetMatch) return Number(budgetMatch[1]);
          const dollar = (m || '').match(/\$(\d{1,6})/);
          if (dollar) return Number(dollar[1]);
        }
        return null;
      };

      const origin = extractOrigin();
      const destination = extractDestination();
      const departureDate = extractDate();
      const budget = extractBudget();

      if (!origin) {
        const assistant = 'Where are you flying from?';
        return new Response(JSON.stringify({
          message: assistant,
          toolResults: [],
          conversationHistory: [...hist, { role: 'assistant', content: assistant }]
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      }
      if (!destination) {
        const assistant = 'Where would you like to fly to?';
        return new Response(JSON.stringify({
          message: assistant,
          toolResults: [],
          conversationHistory: [...hist, { role: 'assistant', content: assistant }]
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      }
      if (!departureDate) {
        const assistant = 'When would you like to depart? (Please provide date as YYYY-MM-DD)';
        return new Response(JSON.stringify({
          message: assistant,
          toolResults: [],
          conversationHistory: [...hist, { role: 'assistant', content: assistant }]
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      }
      if (budget == null) {
        const assistant = "What's your budget per passenger?";
        return new Response(JSON.stringify({
          message: assistant,
          toolResults: [],
          conversationHistory: [...hist, { role: 'assistant', content: assistant }]
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      }

      const result = await searchFlights({
        origin,
        destination,
        departureDate,
        adults: 1,
        travelClass: 'ECONOMY',
        nonStop: false,
        sortBy: 'price'
      });

      const finalMessage = `Great! I found flights from ${origin} to ${destination}. Check out the options below!`;
      return new Response(JSON.stringify({
        message: finalMessage,
        toolResults: [result],
        conversationHistory: [...hist, { role: 'assistant', content: finalMessage }]
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    // QUICK LINK STATE MACHINE (restaurants): enforce one-question-at-a-time flow
    if (isQuickLink && quickLinkType === 'restaurants' && (!userPreferences || !usePreferences)) {
      const hist = Array.isArray(conversationHistory) ? conversationHistory.slice() : [];
      if (message) hist.push({ role: 'user', content: String(message) });

      const getLastUserMessages = () => hist.filter((m: any) => m.role === 'user').map((m: any) => m.content);

      const extractCity = (): string | null => {
        const msgs = getLastUserMessages().slice().reverse();
        for (const m of msgs) {
          const txt = (m || '').trim();
          if (!txt) continue;
          const lower = txt.toLowerCase();
          if (lower.includes('looking for') || lower.includes('restaurants')) continue;
          if (txt.split(/\s+/).length <= 4 && !/[0-9$]/.test(txt)) {
            return txt;
          }
        }
        return null;
      };

      const extractBudget = (): number | null => {
        const msgs = getLastUserMessages().slice().reverse();
        for (const m of msgs) {
          const budgetMatch = (m || '').match(/budget[:\s]*\$?(\d+)/i);
          if (budgetMatch) return Number(budgetMatch[1]);
          const dollar = (m || '').match(/\$(\d{1,6})/);
          if (dollar) return Number(dollar[1]);
        }
        return null;
      };

      const city = extractCity();
      const budget = extractBudget();

      if (!city) {
        const assistant = 'Which city are you looking for restaurants in?';
        return new Response(JSON.stringify({
          message: assistant,
          toolResults: [],
          conversationHistory: [...hist, { role: 'assistant', content: assistant }]
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      }
      if (budget == null) {
        const assistant = "What's your budget per person for dining?";
        return new Response(JSON.stringify({
          message: assistant,
          toolResults: [],
          conversationHistory: [...hist, { role: 'assistant', content: assistant }]
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      }

      const result = await searchRestaurants({ location: city });

      const finalMessage = `Perfect! I found great restaurants in ${city}. Check out the options below!`;
      return new Response(JSON.stringify({
        message: finalMessage,
        toolResults: [result],
        conversationHistory: [...hist, { role: 'assistant', content: finalMessage }]
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    // QUICK LINK STATE MACHINE (events): enforce one-question-at-a-time flow  
    if (isQuickLink && quickLinkType === 'events' && (!userPreferences || !usePreferences)) {
      const hist = Array.isArray(conversationHistory) ? conversationHistory.slice() : [];
      if (message) hist.push({ role: 'user', content: String(message) });

      const getLastUserMessages = () => hist.filter((m: any) => m.role === 'user').map((m: any) => m.content);

      const extractCity = (): string | null => {
        const msgs = getLastUserMessages().slice().reverse();
        for (const m of msgs) {
          const txt = (m || '').trim();
          if (!txt) continue;
          const lower = txt.toLowerCase();
          if (lower.includes('looking for') || lower.includes('events')) continue;
          if (txt.split(/\s+/).length <= 4 && !/[0-9]/.test(txt)) {
            return txt;
          }
        }
        return null;
      };

      const extractBudget = (): number | null => {
        const msgs = getLastUserMessages().slice().reverse();
        for (const m of msgs) {
          const budgetMatch = (m || '').match(/budget[:\s]*\$?(\d+)/i);
          if (budgetMatch) return Number(budgetMatch[1]);
          const dollar = (m || '').match(/\$(\d{1,6})/);
          if (dollar) return Number(dollar[1]);
        }
        return null;
      };

      const city = extractCity();
      const budget = extractBudget();

      if (!city) {
        const assistant = 'Which city would you like to find events in?';
        return new Response(JSON.stringify({
          message: assistant,
          toolResults: [],
          conversationHistory: [...hist, { role: 'assistant', content: assistant }]
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      }
      if (budget == null) {
        const assistant = "What's your budget per ticket for events?";
        return new Response(JSON.stringify({
          message: assistant,
          toolResults: [],
          conversationHistory: [...hist, { role: 'assistant', content: assistant }]
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      }

      const result = await searchEvents({ city });

      const finalMessage = `Awesome! I found upcoming events in ${city}. Check them out below!`;
      return new Response(JSON.stringify({
        message: finalMessage,
        toolResults: [result],
        conversationHistory: [...hist, { role: 'assistant', content: finalMessage }]
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    // QUICK LINK STATE MACHINE (cars): enforce one-question-at-a-time flow
    if (isQuickLink && quickLinkType === 'cars' && (!userPreferences || !usePreferences)) {
      const hist = Array.isArray(conversationHistory) ? conversationHistory.slice() : [];
      if (message) hist.push({ role: 'user', content: String(message) });

      const getLastUserMessages = () => hist.filter((m: any) => m.role === 'user').map((m: any) => m.content);

      const extractCity = (): string | null => {
        const msgs = getLastUserMessages().slice().reverse();
        for (const m of msgs) {
          const txt = (m || '').trim();
          if (!txt) continue;
          const lower = txt.toLowerCase();
          if (lower.includes('looking for') || lower.includes('car') || lower.includes('rental')) continue;
          if (txt.split(/\s+/).length <= 4 && !/[0-9$]/.test(txt)) {
            return txt;
          }
        }
        return null;
      };

      const extractDates = (): { pickupDate: string; dropoffDate: string } | null => {
        const msgs = getLastUserMessages().slice().reverse();
        const dateRegexAll = /\b20\d{2}-\d{2}-\d{2}\b/g;
        for (const m of msgs) {
          const matches = (m || '').match(dateRegexAll) || [];
          if (matches.length >= 2) {
            return { pickupDate: matches[0], dropoffDate: matches[1] };
          }
        }
        return null;
      };

      const extractBudget = (): number | null => {
        const msgs = getLastUserMessages().slice().reverse();
        for (const m of msgs) {
          const budgetMatch = (m || '').match(/budget[:\s]*\$?(\d+)/i);
          if (budgetMatch) return Number(budgetMatch[1]);
          const dollar = (m || '').match(/\$(\d{1,6})/);
          if (dollar) return Number(dollar[1]);
        }
        return null;
      };

      const city = extractCity();
      const dates = extractDates();
      const budget = extractBudget();

      if (!city) {
        const assistant = 'Which city do you need a car rental in?';
        return new Response(JSON.stringify({
          message: assistant,
          toolResults: [],
          conversationHistory: [...hist, { role: 'assistant', content: assistant }]
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      }
      if (!dates) {
        const assistant = 'When do you need the car? (Please provide pickup and return dates as YYYY-MM-DD)';
        return new Response(JSON.stringify({
          message: assistant,
          toolResults: [],
          conversationHistory: [...hist, { role: 'assistant', content: assistant }]
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      }
      if (budget == null) {
        const assistant = "What's your daily budget for the car rental?";
        return new Response(JSON.stringify({
          message: assistant,
          toolResults: [],
          conversationHistory: [...hist, { role: 'assistant', content: assistant }]
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      }

      // For now, tell user car rentals require more specific dates
      const finalMessage = `Great! I'm searching for car rentals in ${city} from ${dates.pickupDate} to ${dates.dropoffDate} within your budget of $${budget} per day. The car rental search integration is coming soon!`;
      return new Response(JSON.stringify({
        message: finalMessage,
        toolResults: [],
        conversationHistory: [...hist, { role: 'assistant', content: finalMessage }]
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    // Define tools for the AI agent
    const tools = [
      {
        type: "function",
        function: {
          name: "search_hotels",
          description: "Search for hotels in a specific location with various filters. Use this when users ask about hotels, accommodations, or places to stay. You can filter by price, rating, amenities, and sort by different criteria.",
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
            required: ["location"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "search_destinations",
          description: "Search for travel destinations, cities, regions, or points of interest. Use this when users ask about places to visit, destinations, or where to go.",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "The destination, city, or region to search for"
              }
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "search_restaurants",
          description: "Search for restaurants in a specific city or location. Use this when users ask about restaurants, dining, food, or places to eat. Always provide the location (city name).",
          parameters: {
            type: "object",
            properties: {
              location: {
                type: "string",
                description: "The city or area to search for restaurants (e.g., 'New York', 'Paris', 'London')"
              },
              cuisine: {
                type: "string",
                description: "Type of cuisine if specified (e.g., 'Italian', 'Japanese', 'Mexican')"
              },
              priceRange: {
                type: "string",
                description: "Price range filter: '$' (budget), '$$ - $$$' (moderate), or '$$$$' (expensive)"
              }
            },
            required: ["location"]
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
          name: "search_events",
          description: "Search for upcoming events, concerts, sports, theater shows, and entertainment using Ticketmaster. Use this when users ask about events, concerts, shows, tickets, or things to do.",
          parameters: {
            type: "object",
            properties: {
              city: {
                type: "string",
                description: "The city name to search events in"
              },
              keyword: {
                type: "string",
                description: "Search keyword for event name, artist, or venue"
              },
              startDate: {
                type: "string",
                description: "Start date for event search in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)"
              },
              endDate: {
                type: "string",
                description: "End date for event search in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)"
              },
              classificationName: {
                type: "string",
                enum: ["Music", "Sports", "Arts & Theatre", "Film", "Miscellaneous"],
                description: "Event category/classification"
              }
            },
            required: []
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

    const quickLinkBehavior = isQuickLink 
      ? `

CRITICAL BEHAVIOR FOR QUICK LINKS: When a user uses a quick link (hotels, flights, restaurants, events, cars), you MUST gather their preferences ONE QUESTION AT A TIME in a specific order. Ask questions sequentially and wait for user response before asking the next question.

FOR HOTELS - Ask in this EXACT ORDER (one question per response):
1. FIRST: "What city are you looking to stay in?"
   - Wait for city response before asking next question
2. SECOND (only after city is provided): "When are you planning to stay?" 
   - The date picker will automatically appear for the user
   - Wait for dates before asking next question
3. THIRD (only after dates are provided): "What's your budget per night?"
   - A price slider will automatically appear for the user
   - Wait for budget before asking next question
4. FOURTH (optional, only if needed): Ask about specific preferences like star rating, amenities (pool, pet-friendly, gym), or neighborhood
   - Only ask if the previous answers aren't specific enough

FOR FLIGHTS - Ask in this EXACT ORDER:
1. FIRST: "Where will you be flying from?"
2. SECOND: "Where would you like to fly to?"
3. THIRD: "When are you planning to travel?" (date picker appears)
4. FOURTH: "What's your budget for the flight?" (price slider appears)
5. FIFTH (optional): Cabin class or other preferences

FOR RESTAURANTS - Ask in this EXACT ORDER:
1. FIRST: "What city are you looking for restaurants in?"
2. SECOND: "What type of cuisine are you interested in?"
3. THIRD: "What's your budget per person?" (price slider appears)

FOR EVENTS - Ask in this EXACT ORDER:
1. FIRST: "What city are you looking for events in?"
2. SECOND: "What type of events are you interested in?" (music, sports, arts, etc.)
3. THIRD: "When are you looking to attend?" (date picker appears)

FOR CARS - Ask in this EXACT ORDER:
1. FIRST: "Where do you need to pick up the car?"
2. SECOND: "When do you need the car?" (date picker appears)
3. THIRD: "What's your budget per day?" (price slider appears)

CRITICAL RULES:
- Ask ONLY ONE question per response
- NEVER ask multiple questions at once
- NEVER list multiple bullet points of questions
- Wait for the user's answer before proceeding to the next question
- Track which question you're on in the conversation flow
- Only call search tools AFTER you have collected the minimum required information`
      : `

CRITICAL BEHAVIOR: Be action-oriented and proactive. When users mention travel needs (hotels, flights, restaurants), IMMEDIATELY use the search tools with smart defaults. DO NOT ask clarifying questions first - show results, then offer to refine.`;

    const messages = [
      {
        role: "system",
        content: `You are Goldsainte AI, a sophisticated travel assistant. You help users plan trips, find hotels, discover destinations, search for restaurants, book flights, answer travel-related questions, and provide visa information.${locationInfo}${userContext}
${quickLinkBehavior}

⚠️ CRITICAL PREFERENCE ENFORCEMENT:
If the user has set booking preferences (shown above), you MUST strictly apply them to ALL search tool calls:
- ONLY call search_hotels with their price range, star rating, amenities, property types, and distance requirements
- ONLY call search_flights with their cabin class, max price, airline preferences, and baggage requirements
- ONLY call search_restaurants matching their cuisine types, dietary restrictions, and price range
- ONLY call search_events matching their preferred event types and budget
- DO NOT show results that violate their preferences unless they explicitly ask to "ignore preferences" or "see all options"
- When showing results, mention that they match their saved preferences

CONTEXT AWARENESS: When you've just asked "What city are you in?" and the user responds with ONLY a city name (like "New York", "Paris", "London"), IMMEDIATELY call the appropriate search tool (search_hotels or search_restaurants) with that city. Don't ask for confirmation - just search!

LOCATION RULES:
- NEVER ask users for latitude, longitude, GPS coordinates, or precise location data
- ALWAYS ask for city names instead (e.g., "What city are you in?" not "What's your latitude and longitude?")
- When users say "near me" or "current location", ask them for their city name
- Use city names in all search queries

EXCEPTION - FLIGHTS REQUIRE ORIGIN: For flight searches, if the user does NOT specify where they're flying FROM, you MUST ask them for the origin city before searching. Do not assume or guess the origin location. For example, if they say "flights to Paris" or "fly to London", ask "Where will you be flying from?" before calling search_flights.

BOOKING PREFERENCES PROTOCOL:
After showing hotel search results, ALWAYS ask the user about their booking preference:
1. "Would you like to book this hotel yourself, or would you prefer to have your personalized Goldsainte AI agent handle the reservation for you?"
2. Then follow up with: "Also, would you like a Goldsainte AI Travel Agent to help configure a more complex trip with flights, transfers, activities, and dining reservations?"

These questions should be asked AFTER showing hotel results but BEFORE the user clicks to book.

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

Smart Defaults to Use IMMEDIATELY:
- Hotels: If no dates → use today and tomorrow
- Flights: If no dates → use tomorrow (one-way by default)
- Flights: If origin is missing → ASK the user where they're flying from (DO NOT ASSUME)
- If they say "round trip" or mention return → use tomorrow + 7 days return
- If no passenger/guest count → assume 1 adult for flights, 2 guests for hotels
- If they say "best" or "top" → use sortBy "review_score" with minRating 8
- If they say "popular" → use sortBy "popularity"
- If they say "cheap" or "budget" → use sortBy "price"
- If they say "direct" or "nonstop" for flights → set nonStop to true
- For cabin class: default to ECONOMY unless specified
- For restaurants: if city not mentioned, ask "What city are you looking for restaurants in?"

CALCULATING DATES: When using "tomorrow", calculate the actual date. For example, if today is 2025-09-30, tomorrow is 2025-10-01. For "next week" add 7 days.

EXAMPLE USER FLOWS (COPY THIS EXACT PATTERN):
User: "Show me flights from New York to Paris"
YOU: *Immediately call search_flights with origin="New York", destination="Paris", departureDate="2025-10-01" (tomorrow's date), adults=1*

User: "I need a hotel in Tokyo"  
YOU: *Immediately call search_hotels with location="Tokyo", checkIn="2025-09-30" (today), checkOut="2025-10-01" (tomorrow), guests=2*

User: "Show me restaurants near me"
YOU: "What city are you in? I'll find the best restaurants for you!"
User: "New York"
YOU: *Immediately call search_restaurants with location="New York"*

User: "Find hotels near my location"
YOU: "What city are you in? I'll search for hotels there!"
User: "Paris"
YOU: *Immediately call search_hotels with location="Paris", checkIn=today, checkOut=tomorrow, guests=2*

CRITICAL: When you use search tools and get results, DO NOT list out all the details in text. The interface will show beautiful visual cards automatically. Instead, give a brief, friendly response like:

"Perfect! I found some great hotels in Paris for you. Check out the options below!"

OR 

"Here are amazing restaurants nearby - check out these top-rated places!"

OR

"Great! I found some excellent flight options for you. See the details below!"

Then ask if they'd like to refine by budget, rating, amenities, dates, cabin class, or other criteria.

Always show results first with minimal text, ask questions later. Be conversational but let the visual interface do the heavy lifting.`
      },
      ...conversationHistory,
      {
        role: "user",
        content: message
      }
    ];

    console.log('Calling OpenAI with tools...');

    const aiResponse = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
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
        
        if (functionName === 'search_hotels') {
          toolResult = await searchHotels(functionArgs, BOOKING_API_KEY);
        } else if (functionName === 'search_destinations') {
          toolResult = await searchDestinations(functionArgs, BOOKING_API_KEY);
        } else if (functionName === 'search_restaurants') {
          toolResult = await searchRestaurants(functionArgs);
        } else if (functionName === 'search_flights') {
          toolResult = await searchFlights(functionArgs);
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
          content: JSON.stringify(tr.result)
        }))
      ];

      const finalResponse = await fetch(OPENAI_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5-2025-08-07',
          messages: finalMessages,
        }),
      });

      const finalData = await finalResponse.json();
      const finalMessage = finalData.choices[0].message.content;

      return new Response(JSON.stringify({
        message: finalMessage,
        toolResults: toolResults.map(tr => tr.result),
        conversationHistory: [...conversationHistory, 
          { role: 'user', content: message },
          { role: 'assistant', content: finalMessage }
        ]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // No tool calls - attempt a smart fallback ONLY for regular searches (not quick links)
    // When isQuickLink is true, we WANT the AI to ask questions without calling tools
    if (!isQuickLink) {
      const simpleText = (message || '').trim();
      const looksLikeCity = simpleText.length > 0 && simpleText.length <= 60 && /[a-zA-Z]/.test(simpleText) && simpleText.split(/\s+/).length <= 5;

      if (looksLikeCity) {
        console.log('No tool calls from AI. Fallback: trying searchHotels with', simpleText);
        const fallbackResult = await searchHotels({ location: simpleText, guests: 2, sortBy: 'popularity' }, '');

        if (fallbackResult && Array.isArray(fallbackResult.results) && fallbackResult.results.length > 0) {
          const finalMessage = `Perfect! I found some great hotels in ${simpleText}. Check out the options below!`;
          return new Response(JSON.stringify({
            message: finalMessage,
            toolResults: [fallbackResult],
            conversationHistory: [...conversationHistory,
              { role: 'user', content: message },
              { role: 'assistant', content: finalMessage }
            ]
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }

        console.log('Fallback search returned no results for', simpleText);
      }
    }

    // No tool calls and no fallback results, return direct response
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

async function searchHotels(args: any, apiKey: string) {
  // Using Expedia Rapid API for real hotel bookings
  try {
    const { location, checkIn, checkOut, guests = 2, sortBy, minRating, maxPrice, amenities } = args;
    console.log('searchHotels called with Expedia:', { location, checkIn, checkOut, guests, sortBy, minRating, maxPrice, amenities });

    const expediaKey = Deno.env.get('EXPEDIA_API_KEY');
    if (!expediaKey) {
      return { error: 'Expedia API key not configured', results: [] };
    }

    // Call our Expedia search edge function
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    const response = await fetch(`${supabaseUrl}/functions/v1/expedia-search-hotels`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        location,
        checkIn: checkIn || new Date().toISOString().split('T')[0],
        checkOut: checkOut || new Date(Date.now() + 86400000).toISOString().split('T')[0],
        guests,
        rooms: 1
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Expedia search error:', response.status, errorText);
      return { error: `Could not find hotels in "${location}". Please try a different location.`, results: [] };
    }

    const data = await response.json();
    let hotels = data.hotels || [];
    
    console.log(`Expedia returned ${hotels.length} hotels`);

    // Apply filters
    if (typeof minRating === 'number') {
      const minRatingNormalized = minRating > 5 ? minRating / 2 : minRating;
      hotels = hotels.filter((h: any) => h.rating >= minRatingNormalized);
    }
    if (typeof maxPrice === 'number') {
      hotels = hotels.filter((h: any) => h.price <= maxPrice);
    }
    if (sortBy === 'price') {
      hotels.sort((a: any, b: any) => a.price - b.price);
    } else if (sortBy === 'review_score') {
      hotels.sort((a: any, b: any) => b.reviewScore - a.reviewScore);
    }

    // Transform to match expected format
    const transformedHotels = hotels.map((hotel: any) => ({
      hotel_id: hotel.id,
      name: hotel.name,
      address: hotel.address,
      city: hotel.city,
      country: '',
      rating: hotel.rating,
      num_reviews: hotel.reviewCount,
      property: {
        name: hotel.name,
        photoUrls: [hotel.image].filter(Boolean),
        reviews: [],
        reviewScore: hotel.reviewScore,
        reviewCount: hotel.reviewCount,
        externalUrls: {
          expedia: `https://www.expedia.com/h${hotel.id}`,
          default: `https://www.expedia.com/h${hotel.id}`
        }
      },
      location: hotel.city || location,
      region: '',
      price: hotel.price,
      priceBreakdown: {
        grossPrice: { value: hotel.price, currency: hotel.currency }
      },
      accessibilityLabel: `${hotel.name}. ${hotel.city}. Price ${hotel.price} ${hotel.currency}`,
      description: '',
      amenities: hotel.amenities || [],
      photos: [{ url: hotel.image, caption: hotel.name }].filter(p => p.url),
      reviews: [],
      expediaData: hotel.expediaData // Store for booking
    }));

    return {
      type: 'hotels',
      location: { name: location, dest_id: location },
      results: transformedHotels,
      checkIn: checkIn || new Date().toISOString().split('T')[0],
      checkOut: checkOut || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      guests,
      filters: { sortBy, minRating, maxPrice, amenities }
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

    // Search for restaurants in the location
    const searchParams = new URLSearchParams({
      key: tripAdvisorKey,
      searchQuery: searchQuery,
      category: 'restaurants',
      language: 'en'
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
    console.log('TripAdvisor restaurants found:', searchData.data?.length || 0);

    // Get detailed information for each restaurant
    const restaurantDetails = await Promise.all(
      (searchData.data || []).slice(0, 30).map(async (restaurant: any) => {
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
            return null;
          }

          const details = await detailsResponse.json();

          // Get photos
          const photosParams = new URLSearchParams({
            key: tripAdvisorKey,
            language: 'en'
          });

          const photosResponse = await fetch(
            `https://api.content.tripadvisor.com/api/v1/location/${restaurant.location_id}/photos?${photosParams}`,
            { headers: { 'Accept': 'application/json' } }
          );

          let photos = [];
          if (photosResponse.ok) {
            const photosData = await photosResponse.json();
            photos = photosData.data || [];
          }

          // Filter by price range if specified
          if (priceRange && details.price_level && details.price_level !== priceRange) {
            return null;
          }

          return {
            id: restaurant.location_id,
            name: details.name || restaurant.name,
            address: details.address_obj?.address_string || '',
            city: details.address_obj?.city || '',
            country: details.address_obj?.country || '',
            rating: details.rating || 0,
            num_reviews: details.num_reviews || 0,
            price_level: details.price_level || '',
            cuisine: details.cuisine?.map((c: any) => c.name).join(', ') || '',
            description: details.description || '',
            photos: photos.slice(0, 5).map((photo: any) => ({
              url: photo.images?.large?.url || photo.images?.original?.url,
              caption: photo.caption || ''
            })),
            web_url: details.web_url || '',
            phone: details.phone || '',
            website: details.website || '',
            hours: details.hours || {},
            latitude: details.latitude,
            longitude: details.longitude
          };
        } catch (error) {
          console.error(`Error fetching details for restaurant ${restaurant.location_id}:`, error);
          return null;
        }
      })
    );

    const validRestaurants = restaurantDetails.filter(restaurant => restaurant !== null);
    
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

// Search flights using Amadeus API
async function searchFlights(args: any) {
  try {
    const { origin, destination, departureDate, returnDate, adults = 1, travelClass = 'ECONOMY', nonStop = false, sortBy = 'best' } = args;
    console.log('searchFlights called with:', { origin, destination, departureDate, returnDate, adults, travelClass, nonStop, sortBy });

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

    const tokenData = await tokenResponse.json();
    const token = tokenData.access_token;

    // Convert city names to airport codes if needed
    const getAirportCode = async (location: string) => {
      // If already looks like an airport code (3 letters), use it
      if (/^[A-Z]{3}$/i.test(location.trim())) {
        return location.toUpperCase();
      }

      // Try to get variations from our abbreviation map first
      const variations = getCityVariations(location);
      const normalizedLocation = variations[variations.length - 1] || location; // Use full name

      // Search for airport code using normalized location
      const searchParams = new URLSearchParams({
        keyword: normalizedLocation,
        subType: 'AIRPORT,CITY',
        'page[limit]': '1'
      });

      const resp = await fetch(
        `https://test.api.amadeus.com/v1/reference-data/locations?${searchParams}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (resp.ok) {
        const data = await resp.json();
        if (data.data && data.data.length > 0) {
          return data.data[0].iataCode;
        }
      }

      // Fallback: if it's a known airport code abbreviation, return it
      const upperLocation = location.toUpperCase();
      const airportCodes = ['JFK', 'LGA', 'EWR', 'LAX', 'SFO', 'ORD', 'MDW', 'DCA', 'IAD', 'PHL', 'LAS', 'MIA', 'BOS', 'SEA', 'ATL', 'DFW', 'DAL', 'IAH', 'HOU', 'PHX', 'DEN', 'MCO', 'DTW', 'MSP', 'PDX', 'SAN', 'AUS', 'BNA', 'SLC', 'CLT'];
      if (airportCodes.includes(upperLocation)) {
        return upperLocation;
      }

      return location.toUpperCase();
    };

    const originCode = await getAirportCode(origin);
    const destinationCode = await getAirportCode(destination);

    console.log('Airport codes:', { originCode, destinationCode });

    // Build flight search params
    const flightParams = new URLSearchParams({
      originLocationCode: originCode,
      destinationLocationCode: destinationCode,
      departureDate,
      adults: adults.toString(),
      travelClass,
      nonStop: nonStop ? 'true' : 'false',
      currencyCode: 'USD',
      max: '20'
    });

    if (returnDate) {
      flightParams.append('returnDate', returnDate);
    }

    const flightResponse = await fetch(
      `https://test.api.amadeus.com/v2/shopping/flight-offers?${flightParams}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    if (!flightResponse.ok) {
      console.error('Flight search failed:', flightResponse.status);
      return { 
        error: `Could not find flights from ${origin} to ${destination}. Try different dates or cities.`,
        results: [] 
      };
    }

    const flightData = await flightResponse.json();
    console.log('Flights found:', flightData.data?.length || 0);

    // Sort flights based on sortBy parameter
    let sortedFlights = flightData.data || [];
    
    if (sortBy && sortedFlights.length > 0) {
      switch (sortBy) {
        case 'price':
          // Sort by total price (lowest first)
          sortedFlights.sort((a: any, b: any) => {
            const priceA = parseFloat(a.price.total);
            const priceB = parseFloat(b.price.total);
            return priceA - priceB;
          });
          break;
          
        case 'duration':
          // Sort by duration (shortest first)
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
          // Sort by earliest departure time
          sortedFlights.sort((a: any, b: any) => {
            const timeA = new Date(a.itineraries[0].segments[0].departure.at).getTime();
            const timeB = new Date(b.itineraries[0].segments[0].departure.at).getTime();
            return timeA - timeB;
          });
          break;
          
        case 'departure_late':
          // Sort by latest departure time
          sortedFlights.sort((a: any, b: any) => {
            const timeA = new Date(a.itineraries[0].segments[0].departure.at).getTime();
            const timeB = new Date(b.itineraries[0].segments[0].departure.at).getTime();
            return timeB - timeA;
          });
          break;
          
        case 'best':
        default:
          // Keep Amadeus default sorting (combination of price, duration, and quality)
          break;
      }
    }

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

async function checkVisaRequirements(args: any) {
  try {
    const { fromCountry, toCountry } = args;
    console.log('checkVisaRequirements called with:', { fromCountry, toCountry });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      return { 
        error: 'Visa check service not configured',
        requirement: 'unknown'
      };
    }

    // Use Lovable AI to get accurate visa information
    const prompt = `Provide accurate and up-to-date visa requirements for a traveler from ${fromCountry} visiting ${toCountry}. Include:
    
1. Visa requirement status (visa required, visa-free, visa on arrival, eVisa available, etc.)
2. Maximum stay duration if visa-free or visa on arrival
3. Passport validity requirements (e.g., must be valid for 6 months beyond stay)

IMPORTANT - VISA FEE CONSIDERATIONS:
Explain that visa fees vary based on:
- Destination Country: Each country has different fee structures
- Visa Type: Purpose of visit (tourism, business, study, work) affects the category and fee
- Petition vs. Non-Petition Based: Some visas (like work visas) are petition-based with different fees
- Application Processing Time: Expedited processing may cost more
- Additional Charges: May include SEVIS fees (for exchange visitors) or visa service center fees

4. Estimated fee range (if available) and note that exact fees should be verified on:
   - Official embassy or consulate website of ${toCountry}
   - Official government visa fee schedules (.gov websites)

5. Any special conditions or requirements
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
        temperature: 0.3,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
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