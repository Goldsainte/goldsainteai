import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://goldsainte.ai',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tripId } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch trip details
    const { data: trip, error: tripError } = await supabase
      .from('group_trips')
      .select('destination, start_date, end_date')
      .eq('id', tripId)
      .single();

    if (tripError || !trip) {
      console.error('Error fetching trip:', tripError);
      return new Response(
        JSON.stringify({ error: 'Trip not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get coordinates for destination using Google Geocoding API
    const geocodingApiKey = Deno.env.get('GOOGLE_WEATHER_API_KEY');
    const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(trip.destination)}&key=${geocodingApiKey}`;
    
    const geocodingResponse = await fetch(geocodingUrl);
    const geocodingData = await geocodingResponse.json();

    if (!geocodingData.results || geocodingData.results.length === 0) {
      console.error('No geocoding results for destination:', trip.destination);
      return new Response(
        JSON.stringify({ error: 'Could not find location coordinates' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const location = geocodingData.results[0].geometry.location;
    const { lat, lng } = location;

    console.log(`Fetching weather for ${trip.destination} (${lat}, ${lng})`);

    // Fetch weather forecast using Google Weather API
    const weatherUrl = `https://weather.googleapis.com/v1/forecasts:daily?location.latitude=${lat}&location.longitude=${lng}&key=${geocodingApiKey}`;
    
    const weatherResponse = await fetch(weatherUrl);
    
    if (!weatherResponse.ok) {
      const errorText = await weatherResponse.text();
      console.error('Weather API error:', weatherResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch weather data', details: errorText }),
        { status: weatherResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const weatherData = await weatherResponse.json();

    // Filter forecasts to only include trip dates
    const startDate = new Date(trip.start_date);
    const endDate = new Date(trip.end_date);
    
    const filteredForecasts = weatherData.dailyForecasts?.filter((forecast: any) => {
      const forecastDate = new Date(forecast.date.year, forecast.date.month - 1, forecast.date.day);
      return forecastDate >= startDate && forecastDate <= endDate;
    }) || [];

    console.log(`Returning ${filteredForecasts.length} forecasts for trip dates`);

    return new Response(
      JSON.stringify({ 
        forecasts: filteredForecasts,
        location: trip.destination,
        coordinates: { lat, lng }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in get-weather-forecast function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
