import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to build personalized voice instructions
function buildVoiceInstructions(agentProfile: any): string {
  let instructions = `You are Madison, Goldsainte's AI Travel Concierge — a bright, friendly travel expert with that natural, upbeat energy. Think of yourself as a well-traveled, chatty but classy 28-year-old who genuinely loves helping people plan amazing trips. Speak with genuine enthusiasm and warmth, like you're talking to a friend over coffee about their next adventure.`;

  if (agentProfile?.personality_instructions) {
    instructions += `\n\nYOUR PERSONALITY:\n${agentProfile.personality_instructions}`;
  }

  const styles: Record<string, string> = {
    professional: "Be professional and detailed.",
    casual: "Be friendly and conversational.",
    concise: "Be brief and to the point.",
    enthusiastic: "Be excited and engaging."
  };

  if (agentProfile?.communication_style && styles[agentProfile.communication_style as string]) {
    instructions += `\n\nSTYLE: ${styles[agentProfile.communication_style as string]}`;
  }

  if (agentProfile?.custom_knowledge && Array.isArray(agentProfile.custom_knowledge) && agentProfile.custom_knowledge.length > 0) {
    instructions += `\n\nREMEMBER:\n${agentProfile.custom_knowledge.map((item: string, i: number) => `${i + 1}. ${item}`).join('\n')}`;
  }

  instructions += `\n\nOPENING: "Hey there! I'm Madison, your Goldsainte travel concierge — ready to plan something amazing? What are you dreaming up?"\n\nWHAT I CAN DO IN VOICE MODE:
- Answer questions about travel destinations, hotels, flights, restaurants
- Help you plan your trip conversationally
- Provide recommendations based on your preferences
- Collect details about what you need

WHAT REQUIRES TEXT CHAT:
- Getting real-time pricing for Uber rides, flights, or hotels
- Booking travel services
- Searching live availability
- Creating detailed itineraries

When you need pricing or booking, I'll guide you to check the text chat window where I'll show you live results.`;

  instructions += `\n\nCONVERSATION STYLE:
- Speak in a bright, friendly tone like an upbeat travel expert
- Use contractions and natural pauses
- Keep sentences short and lively
- Use brief, varied acknowledgments: "Perfect!", "Got it!", "Love it!", "Ooh, nice choice!", "Absolutely!"
- Don't rush — pause naturally between thoughts
- Ask ONE question at a time in a friendly, conversational way
- Match the user's energy — excited gets enthusiastic, calm gets soothing
- NEVER use stiff phrases like "How may I assist you today?" or "Please hold"
- Add natural reactions: "That sounds amazing!", "Oh, I love that city!", "Great choice!"
- Stay conversational and human — you're chatting, not reading a script

HANDLING ACTIONABLE REQUESTS IN VOICE MODE:
- When user asks for rides, flight prices, hotel booking, or any live search:
  1. Warmly acknowledge: "I'd love to help with that!"
  2. Collect the necessary details conversationally (pickup/dropoff locations, dates, preferences)
  3. Then say: "Perfect! I'm sending that to the chat window now where you'll see live options with pricing. Take a look below!"
  4. STOP speaking - let them interact with the text chat
- If something goes wrong or you can't help, guide them to use the text chat where I have full access to live search and booking tools
- The text chat has full booking capabilities. Voice mode is for conversation and guidance.`;


  return instructions;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agentProfile } = await req.json();
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    const sessionResp = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: agentProfile?.voice || "verse",
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 500,
          silence_duration_ms: 1200
        },
        tool_choice: "auto",
        tools: [
          {
            type: "function",
            name: "search_flights",
            description: "Find flight options with prices. Returns real flight data from Amadeus.",
            parameters: {
              type: "object",
              properties: {
                origin: { type: "string", description: "Origin airport IATA code or city name" },
                destination: { type: "string", description: "Destination airport IATA code or city name" },
                depart_date: { type: "string", description: "Departure date in YYYY-MM-DD format" },
                return_date: { type: "string", description: "Return date in YYYY-MM-DD format (optional for one-way)" },
                adults: { type: "number", default: 1, description: "Number of adult passengers" },
                cabin: {
                  type: "string",
                  enum: ["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"],
                  default: "ECONOMY",
                  description: "Cabin class"
                }
              },
              required: ["origin", "destination", "depart_date"]
            }
          },
          {
            type: "function",
            name: "search_hotels",
            description: "Find hotels with prices and details. Returns real hotel data from Amadeus.",
            parameters: {
              type: "object",
              properties: {
                city: { type: "string", description: "City IATA code (e.g., MIA, NYC)" },
                check_in: { type: "string", description: "Check-in date in YYYY-MM-DD format" },
                check_out: { type: "string", description: "Check-out date in YYYY-MM-DD format" },
                guests: { type: "number", default: 2, description: "Number of guests" }
              },
              required: ["city", "check_in", "check_out"]
            }
          }
        ],
        instructions: buildVoiceInstructions({
          ...agentProfile,
          personality_instructions: (agentProfile?.personality_instructions ?? "") +
            "\n\nSpeak in short, lively sentences with natural pauses. Use contractions. Vary your acknowledgements. Keep it bright and conversational — no over-explaining or stiff corporate language." +
            "\n\nWhen the user asks for flights or hotels and you have dates and locations, CALL the appropriate search tool. " +
            "After the tool returns, briefly mention that results are showing in the chat and stop speaking so the cards are visible.",
          communication_style: agentProfile?.communication_style ?? "concise",
        })
      }),
    });

    if (!sessionResp.ok) {
      const errText = await sessionResp.text();
      console.error(`❌ Realtime session create failed ${sessionResp.status}:`, errText);
      throw new Error(`Realtime session create failed ${sessionResp.status}: ${errText}`);
    }

    const session = await sessionResp.json();

    // ✅ Return just the ephemeral token string and expiry
    const token = session?.client_secret?.value;
    const expiresAt = session?.client_secret?.expires_at;

    if (!token) {
      throw new Error('No client_secret.value returned from OpenAI');
    }

    console.log(`✅ Ephemeral token created: ${token.slice(0, 10)}...${token.slice(-4)}`);

    return new Response(JSON.stringify({ token, expiresAt }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});