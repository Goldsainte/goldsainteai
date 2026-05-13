import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://goldsainte.ai',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map common country names to ISO codes and State Dept URLs
const COUNTRY_MAPPING: { [key: string]: { iso: string; url: string; name: string } } = {
  'turkey': { iso: 'TR', url: 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/turkey-travel-advisory.html', name: 'Turkey' },
  'istanbul': { iso: 'TR', url: 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/turkey-travel-advisory.html', name: 'Turkey' },
  'france': { iso: 'FR', url: 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/france-travel-advisory.html', name: 'France' },
  'paris': { iso: 'FR', url: 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/france-travel-advisory.html', name: 'France' },
  'mexico': { iso: 'MX', url: 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/mexico-travel-advisory.html', name: 'Mexico' },
  'japan': { iso: 'JP', url: 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/japan-travel-advisory.html', name: 'Japan' },
  'thailand': { iso: 'TH', url: 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/thailand-travel-advisory.html', name: 'Thailand' },
  'bangkok': { iso: 'TH', url: 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/thailand-travel-advisory.html', name: 'Thailand' },
  'italy': { iso: 'IT', url: 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/italy-travel-advisory.html', name: 'Italy' },
  'rome': { iso: 'IT', url: 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/italy-travel-advisory.html', name: 'Italy' },
  'spain': { iso: 'ES', url: 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/spain-travel-advisory.html', name: 'Spain' },
  'barcelona': { iso: 'ES', url: 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/spain-travel-advisory.html', name: 'Spain' },
  'united kingdom': { iso: 'GB', url: 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/united-kingdom-travel-advisory.html', name: 'United Kingdom' },
  'uk': { iso: 'GB', url: 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/united-kingdom-travel-advisory.html', name: 'United Kingdom' },
  'london': { iso: 'GB', url: 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/united-kingdom-travel-advisory.html', name: 'United Kingdom' },
  'germany': { iso: 'DE', url: 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/germany-travel-advisory.html', name: 'Germany' },
  'egypt': { iso: 'EG', url: 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/egypt-travel-advisory.html', name: 'Egypt' },
  'india': { iso: 'IN', url: 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/india-travel-advisory.html', name: 'India' },
  'china': { iso: 'CN', url: 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/china-travel-advisory.html', name: 'China' },
  'brazil': { iso: 'BR', url: 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/brazil-travel-advisory.html', name: 'Brazil' }
};

const LEVEL_DESCRIPTIONS: { [key: number]: { name: string; description: string; color: string } } = {
  1: { name: 'Exercise Normal Precautions', description: 'Exercise normal precautions when traveling.', color: 'blue' },
  2: { name: 'Exercise Increased Caution', description: 'Exercise increased caution due to some areas of concern.', color: 'yellow' },
  3: { name: 'Reconsider Travel', description: 'Reconsider travel due to serious risks to safety and security.', color: 'orange' },
  4: { name: 'Do Not Travel', description: 'Do not travel due to serious risks to safety and security.', color: 'red' }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { destination } = await req.json();
    
    console.log('Getting travel advisory for:', destination);

    if (!destination) {
      return new Response(JSON.stringify({ 
        error: 'Destination country required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const normalized = destination.toLowerCase().trim();
    const countryInfo = COUNTRY_MAPPING[normalized];

    if (!countryInfo) {
      // Use OpenAI to get advisory info for countries not in our mapping
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      
      if (!LOVABLE_API_KEY) {
        return new Response(JSON.stringify({
          destination,
          level: 1,
          levelName: 'Data Not Available',
          summary: `Travel advisory information for "${destination}" is not currently available. Please check the U.S. State Department website at travel.state.gov for the latest information.`,
          source: 'https://travel.state.gov',
          lastUpdated: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Query AI for travel advisory
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: 'You are a travel safety expert. Provide current U.S. State Department travel advisory information.'
            },
            {
              role: 'user',
              content: `What is the current U.S. State Department travel advisory level for ${destination}? Respond with JSON in this exact format:
{
  "level": (number 1-4),
  "levelName": "(name of level)",
  "summary": "(2-3 sentence summary of key risks)",
  "safetyTips": ["tip1", "tip2", "tip3"],
  "emergencyContact": "(US embassy phone if available)"
}

Level 1 = Exercise Normal Precautions
Level 2 = Exercise Increased Caution  
Level 3 = Reconsider Travel
Level 4 = Do Not Travel

Be accurate and cite official sources.`
            }
          ]
        })
      });

      if (!aiResponse.ok) {
        throw new Error('Failed to get travel advisory from AI');
      }

      const aiData = await aiResponse.json();
      const content = aiData.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('No advisory data returned');
      }

      // Parse JSON response
      const advisoryData = JSON.parse(content);

      return new Response(JSON.stringify({
        destination,
        ...advisoryData,
        source: 'https://travel.state.gov',
        lastUpdated: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // For mapped countries, provide structured data
    // In production, you would fetch real-time data from State Dept API
    const advisory = {
      destination: countryInfo.name,
      iso: countryInfo.iso,
      level: 1, // Default to Level 1 (safe) - in production, fetch real data
      levelName: LEVEL_DESCRIPTIONS[1].name,
      levelDescription: LEVEL_DESCRIPTIONS[1].description,
      summary: `Current travel advisory information for ${countryInfo.name}. Always check official sources for the latest updates.`,
      safetyTips: [
        'Be aware of your surroundings at all times',
        'Keep copies of your passport and important documents',
        'Register with the U.S. State Department STEP program',
        'Have travel insurance with medical coverage'
      ],
      source: countryInfo.url,
      officialSource: 'U.S. Department of State - Bureau of Consular Affairs',
      lastUpdated: new Date().toISOString(),
      emergencyContacts: {
        usEmbassy: 'Contact information available at usembassy.gov',
        local911: 'Varies by country - research before travel'
      }
    };

    console.log(`✅ Travel advisory for ${countryInfo.name}: Level ${advisory.level}`);

    return new Response(JSON.stringify(advisory), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Travel advisory error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
