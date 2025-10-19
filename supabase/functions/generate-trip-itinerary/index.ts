import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Activity {
  time: string;
  activity: string;
  location: string;
  estimatedCost: number;
  duration: string;
  notes: string;
}

interface RestaurantSuggestion {
  name: string;
  cuisine: string;
  priceRange: string;
  location: string;
  estimatedCost: number;
}

interface DailyItinerary {
  day: number;
  date: string;
  theme: string;
  morning: Activity;
  afternoon: Activity;
  evening: Activity;
  meals: {
    breakfast: RestaurantSuggestion;
    lunch: RestaurantSuggestion;
    dinner: RestaurantSuggestion;
  };
  transportation: {
    method: string;
    estimatedCost: number;
    notes: string;
  };
  totalDayCost: number;
  alternatives: Activity[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { destination, startDate, endDate, travelers, interests = [], pace = 'moderate', budget } = await req.json();

    if (!destination || !startDate || !endDate) {
      throw new Error('Missing required fields: destination, startDate, endDate');
    }

    // Calculate number of days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    // Build prompt for AI
    const prompt = `Create a detailed ${days}-day itinerary for ${travelers} travelers visiting ${destination} from ${startDate} to ${endDate}.

Trip Details:
- Pace: ${pace}
- Interests: ${interests.join(', ') || 'general sightseeing'}
- Budget per day: ${budget?.perDay ? `${budget.perDay} ${budget.currency}` : 'flexible'}

For each day, provide:
1. A theme/focus for the day
2. Morning activity (9 AM - 12 PM)
3. Afternoon activity (2 PM - 6 PM)
4. Evening activity (7 PM - 10 PM)
5. Restaurant suggestions for breakfast, lunch, and dinner
6. Transportation recommendations
7. Estimated costs
8. 2-3 alternative activities in case of weather/preferences

Make it practical, culturally enriching, and suitable for ${travelers} people. Include specific locations, timing, and insider tips.

Return the response as valid JSON following this structure:
{
  "itinerary": [
    {
      "day": 1,
      "date": "2024-06-15",
      "theme": "Historic Center Exploration",
      "morning": { "time": "9:00 AM", "activity": "...", "location": "...", "estimatedCost": 20, "duration": "3 hours", "notes": "..." },
      "afternoon": { "time": "2:00 PM", "activity": "...", "location": "...", "estimatedCost": 15, "duration": "4 hours", "notes": "..." },
      "evening": { "time": "7:00 PM", "activity": "...", "location": "...", "estimatedCost": 40, "duration": "3 hours", "notes": "..." },
      "meals": {
        "breakfast": { "name": "...", "cuisine": "...", "priceRange": "$", "location": "...", "estimatedCost": 15 },
        "lunch": { "name": "...", "cuisine": "...", "priceRange": "$$", "location": "...", "estimatedCost": 25 },
        "dinner": { "name": "...", "cuisine": "...", "priceRange": "$$$", "location": "...", "estimatedCost": 50 }
      },
      "transportation": { "method": "Metro/Walking", "estimatedCost": 10, "notes": "..." },
      "totalDayCost": 175,
      "alternatives": [
        { "time": "Flexible", "activity": "...", "location": "...", "estimatedCost": 20, "duration": "2 hours", "notes": "..." }
      ]
    }
  ],
  "overview": {
    "totalCost": 1225,
    "highlights": ["...", "..."],
    "packingTips": ["...", "..."],
    "localTips": ["...", "..."]
  }
}`;

    // Use Lovable AI (Gemini 2.5 Flash) to generate itinerary
    const { data, error } = await supabaseClient.functions.invoke('lovable-ai', {
      body: {
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      }
    });

    if (error) throw error;

    // Parse the AI response
    const aiResponse = data.choices[0].message.content;
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    const itineraryData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (!itineraryData) {
      throw new Error('Failed to parse itinerary from AI response');
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...itineraryData,
        metadata: {
          destination,
          startDate,
          endDate,
          travelers,
          generatedAt: new Date().toISOString()
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error generating itinerary:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
