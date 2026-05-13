import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://goldsainte.ai',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('Fetching user data for recommendations:', user.id);

    // Fetch user's booking history
    const { data: bookings } = await supabaseClient
      .from('bookings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    // Fetch user preferences
    const { data: preferences } = await supabaseClient
      .from('user_booking_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    // Fetch search history
    const { data: searchHistory } = await supabaseClient
      .from('search_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);

    // Fetch favorites
    const { data: favorites } = await supabaseClient
      .from('favorites')
      .select('*')
      .eq('user_id', user.id)
      .limit(20);

    console.log('User data fetched - bookings:', bookings?.length, 'searches:', searchHistory?.length);

    // Build AI prompt with user data
    const systemPrompt = `You are a personalized travel recommendation AI assistant. Analyze the user's travel history, preferences, and behavior to suggest tailored destinations and experiences.

Generate recommendations that match their travel style, budget, and interests. Be specific and actionable.

Return recommendations as a JSON array with this structure:
{
  "recommendations": [
    {
      "destination": "City, Country",
      "destinationCode": "IATA code",
      "confidence": 0-100,
      "reason": "Why this destination matches the user",
      "highlights": ["highlight 1", "highlight 2", "highlight 3"],
      "bestTime": "Best time to visit",
      "estimatedBudget": {
        "min": number,
        "max": number,
        "currency": "USD"
      },
      "experiences": [
        {
          "name": "Experience name",
          "category": "adventure|culture|relaxation|food|nightlife|nature",
          "description": "Brief description"
        }
      ],
      "similar_to": "Which past booking/search this relates to"
    }
  ]
}`;

    const userContext = {
      bookings: bookings || [],
      preferences: preferences || {},
      searchHistory: searchHistory || [],
      favorites: favorites || [],
      stats: {
        totalBookings: bookings?.length || 0,
        totalSearches: searchHistory?.length || 0,
        totalFavorites: favorites?.length || 0
      }
    };

    const userPrompt = `Analyze this user's travel data and generate 5-8 personalized destination recommendations:

${JSON.stringify(userContext, null, 2)}

Focus on:
1. Destinations similar to places they've visited or searched
2. New destinations that match their preferences and budget
3. Unexplored categories they might enjoy based on patterns
4. Seasonal recommendations based on current time

Be specific, creative, and personalized. Return only valid JSON.`;

    console.log('Calling Lovable AI for recommendations...');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_completion_tokens: 4000
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (aiResponse.status === 402) {
        throw new Error('AI service quota exceeded. Please contact support.');
      }
      throw new Error('AI service temporarily unavailable');
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;
    
    console.log('AI response received, parsing recommendations...');

    // Parse JSON from response
    let recommendations;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Failed to generate recommendations');
    }

    console.log('Generated', recommendations.recommendations?.length, 'recommendations');

    return new Response(
      JSON.stringify(recommendations),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in get-personalized-recommendations:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: error.message.includes('Unauthorized') ? 401 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});