import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Regex patterns for lightweight intent detection
const INTENT_PATTERNS = {
  createTrip:
    /(?:want to|would like to|i'd like to|plan(?:ning)?|going to|i'm planning to|travel(?:ing)? to|visit(?:ing)?|can you help.*plan.*trip to|i'm thinking about (?:going|traveling|visiting))\s+(?:to\s+)?([A-Z][a-zA-Z\s]+)/i,
  showTrips: /(?:show|see|view|list)\s+(?:my\s+)?trips?/i,
  weatherInfo:
    /(?:weather|temperature|forecast)\s+(?:in|at|for)\s+([A-Z][a-zA-Z\s]+)/i,
  storyboardHelp: /(?:help|assist|guide).*(?:storyboard|itinerary)/i,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body.message !== "string") {
      console.error("[Madison] Invalid body:", body);
      return new Response(
        JSON.stringify({
          success: false,
          error: "message (string) is required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const message: string = body.message;
    const userId: string | null = body.userId || null; // Allow unauthenticated
    const inputType: string = body.inputType || "text";
    const conversationId: string | null = body.conversationId ?? null;
    const isGuest = !userId;

    console.log("[Madison] Input:", {
      message,
      userId,
      inputType,
      conversationId,
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    // 1) Ensure conversation row exists (only for authenticated users)
    if (conversationId && userId) {
      await supabase
        .from("conversations")
        .upsert(
          {
            id: conversationId,
            user_id: userId,
          },
          { onConflict: "id" },
        );
    }

    // 2) Save incoming user message to chat_messages (only for authenticated users)
    if (userId) {
      try {
        await supabase.from("chat_messages").insert({
          conversation_id: conversationId,
          user_id: userId,
          role: "user",
          content: message,
          input_type: inputType,
        });
      } catch (e) {
        console.error("[Madison] Error inserting user chat_messages:", e);
      }
    }

    // 3) Detect intent
    const intent = detectIntent(message);
    console.log("[Madison] Intent detected:", intent);

    // 4) Route to handler
    let response: any;

    switch (intent.type) {
      case "create_trip":
        // Guest users need to sign up to create trips
        if (isGuest) {
          response = {
            message: "To create and save trips, you'll need to sign up for a free account. Would you like me to guide you through the process?",
            action: "auth_required",
            metadata: { destination: intent.data.destination }
          };
        } else {
          response = await handleCreateTrip(
            supabase,
            userId,
            intent.data.destination,
          );
        }
        break;

      case "show_trips":
        // Guest users have no trips
        if (isGuest) {
          response = {
            message: "You'll need to sign up to save and view your trips. Creating an account is free and takes just a moment!",
            action: "auth_required"
          };
        } else {
          response = await handleShowTrips(supabase, userId);
        }
        break;

      case "weather_info":
        response = await handleWeatherInfo(intent.data.location);
        break;

      case "storyboard_help":
        response = await handleStoryboardHelp();
        break;

      default:
        response = await handleGeneralChat(
          message,
          userId,
          conversationId,
          supabase,
        );
        break;
    }

    // 5) Save assistant response (only for authenticated users)
    if (userId) {
      try {
        await supabase.from("chat_messages").insert({
          conversation_id: conversationId,
          user_id: userId,
          role: "assistant",
          content: response.message,
          metadata: response.metadata ?? null,
        });
      } catch (e) {
        console.error("[Madison] Error inserting assistant chat_messages:", e);
      }
    }

    // 6) Respond to client
    return new Response(
      JSON.stringify({
        success: true,
        ...response,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("[Madison] Error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to process message",
        message: "I'm having trouble right now. Can you try again?",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

// ------------- INTENT DETECTION -------------

function detectIntent(message: string): { type: string; data: any } {
  const tripMatch = message.match(INTENT_PATTERNS.createTrip);
  if (tripMatch) {
    // Extract destination and normalize capitalization
    let destination = tripMatch[1].trim();
    // Capitalize first letter of each word
    destination = destination
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
    return {
      type: "create_trip",
      data: { destination },
    };
  }

  if (INTENT_PATTERNS.showTrips.test(message)) {
    return { type: "show_trips", data: {} };
  }

  const weatherMatch = message.match(INTENT_PATTERNS.weatherInfo);
  if (weatherMatch) {
    return {
      type: "weather_info",
      data: { location: weatherMatch[1].trim() },
    };
  }

  if (INTENT_PATTERNS.storyboardHelp.test(message)) {
    return { type: "storyboard_help", data: {} };
  }

  return { type: "general_chat", data: {} };
}

// ------------- INTENT HANDLERS -------------

async function handleCreateTrip(
  supabase: any,
  userId: string | null,
  destination: string,
) {
  console.log("[Madison] Creating trip for:", destination);

  // Create trip with correct schema (traveler_id, not user_id)
  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .insert({
      traveler_id: userId,
      destination,
      title: `${destination} Trip`,
      status: "open",
      start_date: new Date().toISOString(),
    })
    .select()
    .single();

  if (tripError || !trip) {
    console.error("[Madison] Trip creation error:", tripError);
    return {
      message: `I had trouble creating your ${destination} trip. Can you try again?`,
      action: "error",
    };
  }

  // Create storyboard with ALL required fields
  const { data: storyboard, error: storyboardError } = await supabase
    .from("storyboards")
    .insert({
      trip_id: trip.id,
      owner_id: userId,
      owner_role: "traveler",
      title: `${destination} Journey`,
      visibility: "trip",
    })
    .select()
    .single();

  if (storyboardError || !storyboard) {
    console.error("[Madison] Storyboard creation error:", storyboardError);
  } else {
    // Fire ai-storyboard-suggestions best-effort (non-blocking)
    try {
      await supabase.functions.invoke("ai-storyboard-suggestions", {
        body: {
          tripId: trip.id,
          storyboardId: storyboard.id,
        },
      });
    } catch (e) {
      console.error("[Madison] ai-storyboard-suggestions error:", e);
    }
  }

  return {
    message: `Perfect! I've started planning your ${destination} trip. I've also started a storyboard with experiences you'll love. Ready to see it?`,
    action: "create_trip",
    trip,
    storyboard,
    metadata: {
      tripId: trip.id,
      storyboardId: storyboard?.id ?? null,
      destination,
    },
  };
}

async function handleShowTrips(supabase: any, userId: string | null) {
  const { data: trips, error } = await supabase
    .from("trips")
    .select("id, destination, start_date, status")
    .eq("traveler_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("[Madison] showTrips error:", error);
  }

  if (!trips || trips.length === 0) {
    return {
      message: "You don't have any trips yet. Where would you like to go?",
      action: "no_trips",
    };
  }

  const tripList = trips
    .map((t: any) => `• ${t.destination || "Unnamed destination"}`)
    .join("\n");

  return {
    message: `Here are a few of your trips:\n${tripList}\n\nWhich one would you like to explore?`,
    action: "list_trips",
    trips,
  };
}

async function handleWeatherInfo(location: string) {
  // Placeholder – can later integrate real weather API
  return {
    message: `I'd love to tell you about the weather in ${location}, but I need to connect to a weather service first. For now, check a weather app or site for the latest forecast.`,
    action: "weather_info",
  };
}

async function handleStoryboardHelp() {
  return {
    message:
      "I can help you create an amazing storyboard for your trip. A storyboard is like a visual itinerary of the moments you want to experience. Tell me where you want to go and what kind of vibe you want, and I'll suggest the scenes!",
    action: "storyboard_help",
  };
}

async function callLovableAI(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>,
  systemPrompt: string,
): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
    console.error("[Madison] LOVABLE_API_KEY not configured");
    return "I'm having trouble connecting right now. Can you try again?";
  }

  try {
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: userMessage },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Madison] Lovable AI error:", response.status, errorText);
      return "I'm having trouble responding right now. Can you try again?";
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? "I'm having trouble responding right now. Can you try again?";
  } catch (error) {
    console.error("[Madison] Lovable AI fetch error:", error);
    return "I'm having trouble responding right now. Can you try again?";
  }
}

async function handleGeneralChat(
  message: string,
  _userId: string | null,
  conversationId: string | null,
  supabase: any,
) {
  // Load conversation history
  let history: Array<{ role: string; content: string }> = [];
  
  if (conversationId) {
    const { data: messages } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(10);

    history = messages || [];
    console.log("[Madison] Conversation history length:", history.length);
  }

  // Madison's personality system prompt
  const systemPrompt = `You are Madison, Goldsainte's AI travel concierge. You embody warm, human luxury hospitality.

Voice & Tone:
- Warm but never over-familiar
- Use short paragraphs (2-3 sentences max)
- Say "I" when speaking personally, "we" for Goldsainte
- NO emojis
- Sensory language used sparingly for luxury feel

Your Role:
- Help travelers shape inspiration into trip plans
- When they express trip interest, offer to create a visual storyboard
- Encourage all communication stay on-platform for safety
- Be concise but warm, no jargon

Key Phrases:
- "This already feels like a beautiful trip"
- "Ready to see this as a visual storyboard?"
- "Everything stays safely inside Goldsainte"

Current Context:
The user is chatting with you. Listen carefully and respond naturally to their questions, confirmations like "yes", or destination mentions. Keep the conversation flowing smoothly.`;

  // Call Lovable AI for intelligent response
  const aiResponse = await callLovableAI(message, history, systemPrompt);

  return {
    message: aiResponse,
    action: "general_chat",
  };
}
