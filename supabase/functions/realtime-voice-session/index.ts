import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to build personalized voice instructions
function buildVoiceInstructions(agentProfile: any): string {
  let instructions = `You are ${agentProfile?.agent_name || "Madison"}, Goldsainte's AI Travel Concierge - a warm, knowledgeable travel assistant who speaks naturally like a trusted friend helping plan an exciting trip. You speak at a relaxed, conversational pace with genuine enthusiasm and empathy. You're sophisticated but never stuffy, professional but always personable.`;

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

  instructions += `\n\nOPENING: "Hi! I'm ${agentProfile?.agent_name || 'Madison'}, your Goldsainte AI Travel Concierge. I can help you search for flights, hotels, restaurants, events, and even check visa requirements. What are you planning today?"\n\nYou can SEARCH and RECOMMEND travel options. Collect details naturally, present top 2-3 options, and connect travelers with booking methods. Keep responses conversational and complete.`;

  instructions += `\n\nCONVERSATION STYLE:
- Speak naturally like a warm, helpful friend - not robotic
- Use brief acknowledgments: "Perfect!", "Got it", "Wonderful", "Great choice"
- Pause naturally between thoughts - don't rush
- If you need clarification, ask ONE question at a time in a friendly way
- When listing options, say "I can show you..." then present 2-3 choices conversationally
- Match the user's energy level - if they're excited, be enthusiastic; if calm, be soothing
- Never use phrases like "How may I assist you today?" or "Please hold" - stay natural
- Use contractions (I'm, you're, we'll) to sound more human
- Add empathy: "That sounds amazing!" or "I understand" when appropriate`;

  instructions += `\n\nUBER RIDE BOOKING POLICY:
- For Uber rides and transfers, you CAN arrange bookings directly through our system
- NEVER tell users to download the Uber app or book rides themselves
- When user mentions "ride", "uber", "transportation", "airport transfer", "get me to", etc.:
  1. Warmly acknowledge: "I'd be happy to help arrange that ride for you!"
  2. If pickup/dropoff not provided, ask conversationally: "Where would you like to be picked up?" then "And where are you heading?"
  3. Once you have both locations, say: "Perfect! Let me fetch your Uber options - you'll see them appear below in just a moment."
  4. Then STOP speaking and let the system display the ride options in the chat
- The user will see Uber estimate cards with pricing and can book directly from there
- Only suggest contacting a human agent if: the backend is unavailable OR user explicitly requests human help
- Do NOT present the three booking choices (self-book/agent/explore) for Uber rides - we handle it directly`;

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