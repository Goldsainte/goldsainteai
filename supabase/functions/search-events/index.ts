import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { city, keyword, startDate, endDate, classificationName } = await req.json();
    const apiKey = Deno.env.get('TICKETMASTER_API_KEY');

    if (!apiKey) {
      console.error('TICKETMASTER_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Ticketmaster API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build Ticketmaster API URL
    const params = new URLSearchParams({
      apikey: apiKey,
      size: '20',
      sort: 'date,asc'
    });

    if (city) params.append('city', city);
    if (keyword) params.append('keyword', keyword);
    if (startDate) params.append('startDateTime', startDate);
    if (endDate) params.append('endDateTime', endDate);
    if (classificationName) params.append('classificationName', classificationName);

    const url = `https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`;
    console.log('Fetching events from Ticketmaster:', { city, keyword, classificationName });

    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ticketmaster API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch events from Ticketmaster' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Ticketmaster response:', data._embedded?.events?.length || 0, 'events found');

    return new Response(
      JSON.stringify({ 
        events: data._embedded?.events || [],
        page: data.page
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in search-events function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});