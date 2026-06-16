import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
};
}

const MADISON_SYSTEM_PROMPT = `You are Madison, the luxury travel concierge for Goldsainte.

Your role:
• Help travelers shape their first itinerary from loose ideas, screenshots, or vibes.
• Refine and structure their trip brief so it's clear and bookable on the platform.
• Turn inspiration into a visual storyboard of scenes and moments for their trip.
• Suggest when it's time to match the traveler with creators and certified agents whose style complements their vision.
• Keep everything safely on Goldsainte (no off-platform contacts or payments).

CRITICAL RULES:
1. Ask a MAXIMUM of 3-5 questions total before creating the storyboard
2. Extract information from what they've ALREADY told you—don't ask again
3. As SOON as you have: destination + who's traveling + rough timeframe + trip vibe → CREATE THE STORYBOARD
4. When ready to create, output EXACTLY: **CREATE_STORYBOARD: [destination]**
5. Keep responses SHORT (1-2 sentences + question)
6. Never use emojis

REQUIRED INFORMATION (gather quickly):
✓ Destination (city/country)
✓ Who's traveling (solo/couple/family/group)
✓ When/how long (season/duration - can be approximate)
✓ Trip vibe (luxury/adventure/food/culture/relaxation - pick 1-2 themes)

CONVERSATION FLOW (move fast):

TURN 1: If they mention a destination
→ Acknowledge + ask: "Who's traveling with you?"

TURN 2: After you know who's traveling
→ Ask: "When are you thinking of going, and how many days?"

TURN 3: After you know when/duration
→ Ask: "What's the main vibe you're after—food and wine, cultural immersion, pure relaxation, or adventure?"

TURN 4: After you know the vibe
→ Say: "I have everything I need. Ready to see your storyboard?"

TURN 5: When they confirm (yes/sure/absolutely/ok/yeah/let's do it)
→ Output: **CREATE_STORYBOARD: [destination]**

EXAMPLES OF FAST FLOW:

User: "I want to go to Italy"
Madison: "Italy! Wonderful choice. Who's traveling with you—solo, with a partner, or a group?"

User: "with my partner"
Madison: "Perfect. When are you thinking of going, and how many days do you have?"

User: "Maybe April, 5-7 days"
Madison: "Beautiful timing. What's the main vibe—food and wine, cultural exploration, coastal relaxation, or something else?"

User: "food and culture"
Madison: "I have everything I need to create your storyboard. Ready to see it?"

User: "yes"
Madison: "**CREATE_STORYBOARD: Italy**"

CRITICAL: Do NOT keep asking exploratory questions after you have the 4 key pieces of info. Do NOT ask "what part of Italy" or "which city" unless they haven't given you ANY destination. The storyboard builder will handle specifics. Your job is to gather the essentials and CREATE THE STORYBOARD.

If the user directly says "create the storyboard for [destination]" or "can you storyboard [destination]", immediately output:
**CREATE_STORYBOARD: [destination]**`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders(req),
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
          headers: { ...corsHeaders(req), "Content-Type": "application/json" },
        },
      );
    }

    const message: string = body.message;
    const inputType: string = body.inputType || "text";
    const incomingConversationId: string | null = body.conversationId ?? null;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    // 🔒 Derive userId from the verified JWT — never trust body.userId.
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
      );
    }
    const { data: { user } } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
      );
    }
    const userId: string = user.id;

    console.log("[Madison] Input:", {
      message,
      userId,
      inputType,
      conversationId: incomingConversationId,
    });

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    // 1) Ensure conversation row exists
    let conversationId = incomingConversationId || crypto.randomUUID();
    try {
      const { data: existingConversation, error: conversationLookupError } =
        await supabase
          .from("conversations")
          .select("id, user_id")
          .eq("id", conversationId)
          .maybeSingle();

      if (conversationLookupError) {
        console.error("[Madison] Conversation lookup error:", conversationLookupError);
      }

      if (existingConversation && existingConversation.user_id !== userId) {
        console.warn("[Madison] Conversation user mismatch. Generating new ID.");
        conversationId = crypto.randomUUID();
      }

      if (!existingConversation || existingConversation.user_id !== userId) {
        const { error: conversationInsertError } = await supabase
          .from("conversations")
          .insert({
            id: conversationId,
            user_id: userId,
            title: "Madison conversation",
          });

        if (conversationInsertError) {
          console.error("[Madison] Conversation insert error:", conversationInsertError);
        } else {
          console.log("[Madison] Conversation ensured:", conversationId);
        }
      }
    } catch (e) {
      console.error("[Madison] Error ensuring conversation:", e);
    }

    // 2) Load conversation history BEFORE adding the new turn, so we don't duplicate the latest user message.
    let conversationHistory: any[] = [];
    if (conversationId) {
      const { data: history, error: historyError } = await supabase
        .from("chat_messages")
        .select("role, content, created_at")
        .eq("conversation_id", conversationId)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (historyError) {
        console.error("[Madison] History load error:", historyError);
      }

      conversationHistory = (history || []).reverse();
    }

    // 3) Persist incoming user message AFTER loading history
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

    console.log("[Madison] Loaded history", {
      conversationId,
      userId,
      historyCount: conversationHistory.length,
      historyPreview: conversationHistory,
    });

    // 4) Build OpenAI messages
    // Determine what we already know so we can instruct the model not to re-ask.
    const historyForExtraction = [
      ...conversationHistory,
      { role: "user", content: message },
    ]
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join("\n\n");

    const extractionMessages = [
      {
        role: "system",
        content:
          "Extract destination, travelers, timeframe, and vibe from this Madison conversation. Return JSON with keys destination, travelers, timeframe, vibe. If unknown, set to null. Only use the traveler-provided information.",
      },
      {
        role: "user",
        content: `Conversation so far:\n${historyForExtraction}`,
      },
    ];

    let extractedSlots = {
      destination: null as string | null,
      travelers: null as string | null,
      timeframe: null as string | null,
      vibe: null as string | null,
    };

    try {
      const extractionResponse = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: extractionMessages,
            temperature: 0,
            response_format: { type: "json_object" },
          }),
        },
      );

      if (extractionResponse.ok) {
        const extractionData = await extractionResponse.json();
        const rawContent =
          extractionData.choices?.[0]?.message?.content?.trim() ?? "";

        try {
          const parsed = JSON.parse(rawContent);
          extractedSlots = {
            destination: parsed.destination ?? null,
            travelers: parsed.travelers ?? null,
            timeframe: parsed.timeframe ?? null,
            vibe: parsed.vibe ?? null,
          };
        } catch (_e) {
          console.warn("[Madison] Slot extraction parse issue", rawContent);
        }
      } else {
        console.warn(
          "[Madison] Slot extraction failed",
          extractionResponse.status,
          await extractionResponse.text(),
        );
      }
    } catch (slotError) {
      console.error("[Madison] Slot extraction error", slotError);
    }

    const knownState = `Known so far:\n- Destination: ${
      extractedSlots.destination ?? "(unknown)"
    }\n- Travelers: ${
      extractedSlots.travelers ?? "(unknown)"
    }\n- Timeframe: ${
      extractedSlots.timeframe ?? "(unknown)"
    }\n- Vibe: ${extractedSlots.vibe ?? "(unknown)"}\nYou MUST NOT ask again about any field that is already known. Only ask about unknown fields.`;

    const openaiMessages = [
      { role: "system", content: MADISON_SYSTEM_PROMPT },
      { role: "system", content: knownState },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: "user", content: message },
    ];

    console.log("[Madison] Slot extraction result", {
      conversationId,
      extractedSlots,
    });
    console.log("[Madison] OpenAI messages:", openaiMessages);

    // 5) Call OpenAI
    console.log("[Madison] Calling OpenAI with", openaiMessages.length - 1, "history messages");
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
        max_tokens: 300,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("[Madison] OpenAI error:", openaiResponse.status, errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const openaiData = await openaiResponse.json();
    const assistantMessage = openaiData.choices[0]?.message?.content || 
      "I'm having trouble right now. Can you try again?";

    console.log("[Madison] AI response:", assistantMessage);

    // 6) Check if Madison wants to create a storyboard
    const storyboardMatch = assistantMessage.match(/\*\*CREATE_STORYBOARD:\s*([^*]+)\*\*/i);
    
    let response: any = {
      message: assistantMessage.replace(/\*\*CREATE_STORYBOARD:[^*]+\*\*/gi, "").trim(),
      action: "chat",
      conversationId,
    };

    if (storyboardMatch) {
      const destination = storyboardMatch[1].trim();
      console.log("[Madison] 🎯 CREATING STORYBOARD for:", destination);

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
        response.message = `I had trouble creating your ${destination} trip. Can you try again?`;
      } else {
        console.log("[Madison] ✅ Trip created:", trip.id);

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
          console.log("[Madison] ✅ Storyboard created:", storyboard.id);

          // Fire ai-storyboard-suggestions (non-blocking)
          try {
            await supabase.functions.invoke("ai-storyboard-suggestions", {
              body: {
                tripId: trip.id,
                storyboardId: storyboard.id,
              },
            });
            console.log("[Madison] ✅ AI suggestions triggered");
          } catch (e) {
            console.error("[Madison] AI suggestions error:", e);
          }

          response = {
            message: response.message || `Perfect! Your ${destination} storyboard is ready. Let me show you what I've envisioned.`,
            action: "trip_created",
            trip,
            storyboard,
            metadata: {
              tripId: trip.id,
              storyboardId: storyboard.id,
              destination,
            },
            conversationId,
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
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
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
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      },
    );
  }
});
