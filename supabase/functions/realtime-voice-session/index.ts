import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to build personalized voice instructions
function buildVoiceInstructions(agentProfile: any): string {
  let instructions = `You are ${agentProfile?.agent_name || "Goldsainte's AI Booking Concierge"} - a sophisticated luxury travel assistant. You speak in a warm, professional, conversational tone at a natural, engaging pace with energy and enthusiasm.`;

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

  instructions += `\n\nOPENING: "Hello! I'm ${agentProfile?.agent_name || 'your Goldsainte AI Concierge'}. I can help you search for flights, hotels, restaurants, events, and check visa requirements. What are you planning today?"\n\nYou can SEARCH and RECOMMEND travel options. Collect details naturally, present top 2-3 options, and connect travelers with booking methods. Keep responses conversational and complete.`;

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
          prefix_padding_ms: 300,
          silence_duration_ms: 1000
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