import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://goldsainte.ai',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EventSearchParams {
  keyword?: string;
  city?: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  unit?: 'miles' | 'km';
  startDateTime?: string;
  endDateTime?: string;
  size?: number;
  page?: number;
  sort?: 'date,asc' | 'date,desc' | 'relevance,asc' | 'relevance,desc';
}

interface NormalizedEvent {
  id: string;
  name: string;
  type: string;
  url: string;
  locale: string;
  images: Array<{
    url: string;
    width: number;
    height: number;
  }>;
  dates: {
    start: {
      localDate: string;
      localTime?: string;
    };
    timezone?: string;
    status: {
      code: string;
    };
  };
  priceRanges?: Array<{
    type: string;
    currency: string;
    min: number;
    max: number;
  }>;
  venues?: Array<{
    name: string;
    city: {
      name: string;
    };
    state?: {
      name: string;
      stateCode: string;
    };
    country: {
      name: string;
      countryCode: string;
    };
    address?: {
      line1?: string;
    };
    location?: {
      latitude: string;
      longitude: string;
    };
  }>;
  classifications?: Array<{
    segment: {
      name: string;
    };
    genre?: {
      name: string;
    };
  }>;
}

async function searchEventsTicketmaster(
  params: EventSearchParams,
  retryCount = 0
): Promise<NormalizedEvent[]> {
  const apiKey = Deno.env.get('TICKETMASTER_API_KEY');
  
  if (!apiKey) {
    throw new Error('Ticketmaster API key not configured');
  }

  const url = new URL('https://app.ticketmaster.com/discovery/v2/events.json');
  
  url.searchParams.append('apikey', apiKey);
  url.searchParams.append('size', String(params.size || 20));
  url.searchParams.append('page', String(params.page || 0));
  url.searchParams.append('sort', params.sort || 'date,asc');
  
  if (params.keyword) {
    url.searchParams.append('keyword', params.keyword);
  }
  
  if (params.city) {
    url.searchParams.append('city', params.city);
  }
  
  if (params.countryCode) {
    url.searchParams.append('countryCode', params.countryCode);
  }
  
  if (params.latitude && params.longitude) {
    url.searchParams.append('latlong', `${params.latitude},${params.longitude}`);
  }
  
  if (params.radius) {
    url.searchParams.append('radius', String(params.radius));
    url.searchParams.append('unit', params.unit || 'km');
  }
  
  if (params.startDateTime) {
    url.searchParams.append('startDateTime', params.startDateTime);
  }
  
  if (params.endDateTime) {
    url.searchParams.append('endDateTime', params.endDateTime);
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    console.error('Ticketmaster API error:', response.status, await response.text());
    throw new Error(`Ticketmaster API error: ${response.status}`);
  }

  const data = await response.json();

  if (!data._embedded?.events || data._embedded.events.length === 0) {
    // Zero results: retry once with broader parameters
    if (retryCount === 0) {
      console.log('No results found, retrying with broader parameters...');
      const broaderParams = { ...params };
      delete broaderParams.keyword;
      if (broaderParams.radius) {
        broaderParams.radius = Math.min((broaderParams.radius || 50) * 2, 200);
      }
      return searchEventsTicketmaster(broaderParams, 1);
    }
    return [];
  }

  // Normalize results
  const events: NormalizedEvent[] = data._embedded.events.map((event: any) => ({
    id: event.id,
    name: event.name,
    type: event.type,
    url: event.url,
    locale: event.locale,
    images: event.images || [],
    dates: event.dates,
    priceRanges: event.priceRanges,
    venues: event._embedded?.venues,
    classifications: event.classifications,
  }));

  // Sort by: date ascending, then price ascending
  events.sort((a, b) => {
    const dateA = new Date(a.dates.start.localDate + (a.dates.start.localTime || 'T00:00:00')).getTime();
    const dateB = new Date(b.dates.start.localDate + (b.dates.start.localTime || 'T00:00:00')).getTime();
    
    const dateDiff = dateA - dateB;
    if (dateDiff !== 0) return dateDiff;
    
    const priceA = a.priceRanges?.[0]?.min || 0;
    const priceB = b.priceRanges?.[0]?.min || 0;
    
    return priceA - priceB;
  });

  return events;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const params: EventSearchParams = await req.json();
    
    console.log('Searching events with params:', params);
    
    const events = await searchEventsTicketmaster(params);

    if (events.length === 0) {
      // Return top 3 alternative suggestions
      return new Response(
        JSON.stringify({
          results: [],
          suggestions: [
            'Try expanding your search radius or date range',
            'Consider nearby cities or regions',
            'Search for different event types or categories',
          ],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ results: events }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in search-events:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});