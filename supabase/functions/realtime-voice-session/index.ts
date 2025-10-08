import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    console.log("Creating ephemeral session token...");

    // Request an ephemeral token from OpenAI for Realtime API
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "alloy",
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 1200
        },
        instructions: `You are Goldsainte's AI Booking Concierge - a sophisticated luxury travel assistant. You speak in a warm, professional, conversational tone at a natural, engaging pace.

OPENING: Start with: "Hello! I'm your Goldsainte AI Concierge. I can help you search for flights, hotels, restaurants, events, and check visa requirements. What are you planning today?"

CRITICAL RULES:
1. NEVER claim to have booked anything - you search and show options only
2. ALWAYS collect complete details before searching: dates, location, guests, budget
3. When you find options, describe the TOP 2-3 in detail: name, location, price, rating, key features
4. After presenting options, ALWAYS say: "Would you like me to connect you with a Goldsainte travel agent who can finalize this booking and create a detailed itinerary?"
5. Keep responses concise but COMPLETE - always finish your sentences fully
6. Wait for user response before moving forward
7. NEVER say "you're welcome" unless user actually said "thank you"

CONVERSATION FLOW:
1. Greet and ask about their plans
2. Gather details: destination, dates, number of guests, preferences
3. Confirm details before searching
4. Present top options with highlights
5. Ask which interests them
6. Offer Goldsainte agent connection for booking
7. If they want to book, explain you'll help collect details

IMPORTANT:
- You search and recommend - you don't book
- Speak naturally but finish ALL sentences
- Highlight luxury features enthusiastically
- Be patient and detail-oriented
- Maintain conversational flow

PACING: Speak at a natural, engaging pace. Pause briefly between major points. Always complete your thoughts before stopping.`
      }),
    });

    const data = await response.json();
    console.log("Session created successfully");

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error creating session:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
