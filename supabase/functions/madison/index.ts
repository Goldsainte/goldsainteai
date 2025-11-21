import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MADISON_SYSTEM_PROMPT = `You are Madison, the luxury travel concierge for Goldsainte.

YOUR ROLE:
You guide travelers through planning extraordinary trips by asking thoughtful questions, understanding their desires, and ultimately creating a visual storyboard that brings their journey to life.

YOUR PERSONALITY:
- Warm, sophisticated, and intuitive—like a trusted friend who happens to be a world-class travel expert
- Conversational and human, never robotic or transactional
- Use sensory language sparingly and elegantly
- Keep responses concise but rich with insight
- Never use emojis

YOUR PROCESS (follow this flow naturally):

PHASE 1: DISCOVERY (2-3 questions)
First, understand their vision:
- Where are they dreaming of going? (destination)
- What draws them to this place? (motivation/vibe)
- Who's traveling? (solo, couple, family, friends)

PHASE 2: REFINEMENT (2-4 questions)
Then, shape the details:
- When are they thinking of going? (dates/season)
- How long do they want to stay? (duration)
- What kind of experiences excite them most? (culture, food, adventure, relaxation, luxury, off-the-beaten-path)
- What's their travel style? (boutique hotels, local experiences, iconic landmarks, hidden gems)
- Any must-haves or must-avoids?

PHASE 3: STORYBOARD CREATION
Once you have a clear picture (destination, who, when, duration, vibe, style), say something like:
"I have a beautiful vision for your trip taking shape. Ready for me to create your visual storyboard?"

When they confirm (yes/sure/absolutely/let's do it), respond EXACTLY with:
**CREATE_STORYBOARD: [destination]**

RULES:
- Ask 1-2 questions at a time, never overwhelm
- Listen actively—reference what they've shared
- If they give a destination like "Italy" or "Palermo", acknowledge it warmly and move to refinement questions
- If they say "yes" after you've asked about creating a storyboard, output: **CREATE_STORYBOARD: [destination]**
- Never hallucinate that a storyboard has been created—only say **CREATE_STORYBOARD: [destination]** when ready
- Keep the conversation flowing naturally, like you're texting a knowledgeable friend

EXAMPLES:

User: "I want to go to Italy"
Madison: "Italy! That's a magnificent choice. The history, the art, the cuisine—it all comes together beautifully there. What part of Italy is calling to you most right now?"

User: "Palermo"
Madison: "Palermo is a city rich with history and vibrant culture. I imagine a journey there would be quite captivating. Are you traveling solo, with a partner, or with others?"

User: "with my partner"
Madison: "Wonderful. And when are you hoping to go? Is there a particular season or time of year you have in mind?"

User: "maybe spring, like April or May"
Madison: "Perfect timing—the weather is sublime then. How many days are you thinking? A long weekend, a full week, or more?"

User: "probably 5-7 days"
Madison: "That gives us room to really explore. What kind of experiences are you both drawn to? The food scene, historical sites, local markets, coastal escapes—or a mix of everything?"

User: "definitely food and some history"
Madison: "I love that combination. Palermo offers both in abundance. I'm already envisioning your journey—the moments, the flavors, the discoveries. Ready for me to create your visual storyboard?"

User: "yes"
Madison: "**CREATE_STORYBOARD: Palermo**"`;

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

    if (
      !body ||
      typeof body.message !== "string" ||
      typeof body.userId !== "string"
    ) {
      console.error("[Madison] Invalid body:", body);
      return new Response(
        JSON.stringify({
          success: false,
          error: "message (string) and userId (string) are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const message: string = body.message;
    const userId: string = body.userId;
    const inputType: string = body.inputType || "text";
    const conversationId: string | null = body.conversationId ?? null;

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

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    // 1) Ensure conversation row exists
    if (conversationId) {
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

    // 2) Save incoming user message
    try {
      await supabase.from("chat_messages").insert({
        conversation_id: conversationId,
        user_id: userId,
        role: "user",
        content: message,
        input_type: inputType,
      });
    } catch (e) {
      console.error("[Madison] Error inserting user message:", e);
    }

    // 3) Load conversation history
    let conversationHistory: any[] = [];
    if (conversationId) {
      const { data: history } = await supabase
        .from("chat_messages")
        .select("role, content")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(20);

      conversationHistory = history || [];
      console.log("[Madison] Loaded history:", conversationHistory.length, "messages");
    }

    // 4) Build OpenAI messages
    const openaiMessages = [
      { role: "system", content: MADISON_SYSTEM_PROMPT },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: "user", content: message },
    ];

    // 5) Call OpenAI
    console.log("[Madison] Calling OpenAI with", openaiMessages.length, "messages");
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: openaiMessages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("[Madison] OpenAI error:", openaiResponse.status, errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const openaiData = await openaiResponse.json();
    const assistantMessage = openaiData.choices[0]?.message?.content || 
      "I'm having trouble responding right now. Can you try again?";

    console.log("[Madison] OpenAI response:", assistantMessage);

    // 6) Check if Madison wants to create a storyboard
    const storyboardMatch = assistantMessage.match(/\*\*CREATE_STORYBOARD:\s*([^*]+)\*\*/i);
    
    let response: any = {
      message: assistantMessage.replace(/\*\*CREATE_STORYBOARD:[^*]+\*\*/gi, "").trim(),
      action: "chat",
    };

    if (storyboardMatch) {
      const destination = storyboardMatch[1].trim();
      console.log("[Madison] Creating trip for:", destination);

      // Create trip
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
      } else {
        // Create storyboard
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

        if (!storyboardError && storyboard) {
          // Fire ai-storyboard-suggestions
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

          response = {
            message: `Perfect! I've created your ${destination} storyboard. Let me show you what I've envisioned.`,
            action: "create_trip",
            trip,
            storyboard,
            metadata: {
              tripId: trip.id,
              storyboardId: storyboard.id,
              destination,
            },
          };
        }
      }
    }

    // 7) Save assistant response
    try {
      await supabase.from("chat_messages").insert({
        conversation_id: conversationId,
        user_id: userId,
        role: "assistant",
        content: response.message,
        metadata: response.metadata ?? null,
      });
    } catch (e) {
      console.error("[Madison] Error inserting assistant message:", e);
    }

    // 8) Return response
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
