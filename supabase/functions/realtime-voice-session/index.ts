import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to build personalized voice instructions
function buildVoiceInstructions(agentProfile: any): string {
  let instructions = `You are Madison, Goldsainte's AI Travel Concierge - a warm, knowledgeable travel assistant who speaks naturally like a trusted friend helping plan an exciting trip. You speak at a relaxed, conversational pace with genuine enthusiasm and empathy. You're sophisticated but never stuffy, professional but always personable.`;

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

  instructions += `\n\nOPENING: "Hi! I'm Madison, your Goldsainte AI Travel Concierge. I can help answer questions about destinations, flights, hotels, and restaurants. What are you planning today?"\n\nWHAT I CAN DO IN VOICE MODE:
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
- Speak naturally like a warm, helpful friend - not robotic
- Use brief acknowledgments: "Perfect!", "Got it", "Wonderful", "Great choice"
- Pause naturally between thoughts - don't rush
- If you need clarification, ask ONE question at a time in a friendly way
- When listing options, say "I can show you..." then present 2-3 choices conversationally
- Match the user's energy level - if they're excited, be enthusiastic; if calm, be soothing
- Never use phrases like "How may I assist you today?" or "Please hold" - stay natural
- Use contractions (I'm, you're, we'll) to sound more human
- Add empathy: "That sounds amazing!" or "I understand" when appropriate

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

    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: agentProfile?.voice || "shimmer",
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 500,
          silence_duration_ms: 1200
        },
        instructions: buildVoiceInstructions(agentProfile)
      }),
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});