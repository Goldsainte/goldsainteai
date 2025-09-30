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
    const { location, checkIn, checkOut, guests } = await req.json();
    
    console.log('Search hotels request:', { location, checkIn, checkOut, guests });

    const apiKey = Deno.env.get('BOOKING_API_KEY');
    if (!apiKey) {
      throw new Error('BOOKING_API_KEY not configured');
    }

    // Search for location first to get destination ID
    const locationResponse = await fetch(
      `https://booking-com15.p.rapidapi.com/api/v1/hotels/searchDestination?query=${encodeURIComponent(location)}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'booking-com15.p.rapidapi.com'
        }
      }
    );

    if (!locationResponse.ok) {
      throw new Error(`Location search failed: ${locationResponse.statusText}`);
    }

    const locationData = await locationResponse.json();
    console.log('Location data:', locationData);

    if (!locationData.data || locationData.data.length === 0) {
      return new Response(JSON.stringify({ error: 'Location not found', results: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Build destination candidates with preference order
    const rawResults = Array.isArray(locationData.data) ? locationData.data : [];
    const preference = ['city', 'district', 'region', 'landmark'];
    const candidates = rawResults
      .filter((d: any) => d?.dest_id && d?.search_type)
      .sort((a: any, b: any) => preference.indexOf(a.search_type?.toLowerCase()) - preference.indexOf(b.search_type?.toLowerCase()))
      .map((d: any) => ({ dest_id: String(d.dest_id), search_type: String(d.search_type).toUpperCase(), raw: d }));

    if (candidates.length === 0) {
      return new Response(JSON.stringify({ results: [], error: 'No valid destinations found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Fallback dates if not provided
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const arrival = checkIn && String(checkIn).trim() !== '' ? checkIn : today.toISOString().split('T')[0];
    const departure = checkOut && String(checkOut).trim() !== '' ? checkOut : tomorrow.toISOString().split('T')[0];

    let chosen: any = null;
    let hotels: any[] = [];
    let lastError: string | null = null;

    for (const c of candidates) {
      const params = new URLSearchParams({
        dest_id: c.dest_id,
        search_type: c.search_type,
        arrival_date: arrival,
        departure_date: departure,
        adults: String(guests || 2),
        room_qty: '1',
        page_number: '1',
        units: 'metric',
        temperature_unit: 'c',
        languagecode: 'en-us',
        currency_code: 'USD'
      });
      const hotelsUrl = `https://booking-com15.p.rapidapi.com/api/v1/hotels/searchHotels?${params.toString()}`;
      console.log('Trying destination', { dest_id: c.dest_id, search_type: c.search_type, hotelsUrl });

      const hotelsResponse = await fetch(hotelsUrl, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'booking-com15.p.rapidapi.com'
        }
      });

      if (!hotelsResponse.ok) {
        lastError = `Hotels search failed: ${hotelsResponse.status} ${hotelsResponse.statusText}`;
        continue;
      }

      const hotelsData = await hotelsResponse.json();
      const count = hotelsData?.data?.hotels?.length || 0;
      console.log(`Hotels found for ${c.search_type} ${c.dest_id}:`, count);

      if (count > 0) {
        chosen = c;
        hotels = hotelsData.data.hotels;
        break;
      }
    }

    return new Response(JSON.stringify({ 
      results: hotels,
      location: chosen?.raw || rawResults[0] || null,
      debug: { tried: candidates.map((cand: any) => ({ dest_id: cand.dest_id, search_type: cand.search_type })), lastError }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });


  } catch (error) {
    console.error('Error in search-hotels:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});