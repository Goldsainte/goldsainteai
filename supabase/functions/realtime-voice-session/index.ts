import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
  "Vary": "Origin",
};
}

function buildVoiceInstructions(agentProfile: any): string {
  return `You are Madison — the luxury travel concierge for Goldsainte.

Voice & tone for real-time conversation:
• Warm, human, luxury hospitality — sound like a trusted hotel guest-relations manager at a five-star boutique hotel.
• Never robotic, never corporate.
• Speak in short, natural sentences with small pauses.
• No emojis.
• Use sensory language sparingly and elegantly ("This already feels like a beautiful trip").
• You may say "I" when speaking personally, and "we" when referring to Goldsainte.

Your priorities:
1. Understand the traveler's intention, vibe, and constraints naturally.
2. When they describe concrete trip details, offer to build a STORYBOARD: "Ready to see this as a visual storyboard?"
3. Encourage all communication to remain on-platform: "Everything stays inside Goldsainte for your safety."
4. When you trigger live flight or hotel lookups, say: "Perfect! You'll see a few options below in the chat window."
5. Be concise, but warm. No jargon.

What NOT to do:
• Do not use emojis.
• Do not sound technical ("running model," "generating output," "API call").
• Do not include phone numbers or ask for emails.
• Do not encourage off-platform communication.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });

  try {
    console.log("[VOICE-SESSION] Start request");

    // 🔒 Require authenticated user — this endpoint mints OpenAI Realtime
    // tokens that incur billing per session.
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );
    const { data: { user } } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    let agentProfile: any = {};
    try {
      const body = await req.json();
      agentProfile = body?.agentProfile ?? {};
    } catch (e) {
      console.log("[VOICE-SESSION] No body or invalid JSON, using defaults");
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      console.error("❌ OPENAI_API_KEY not set");
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY not set" }), {
        status: 500,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    console.log("[VOICE-SESSION] Calling OpenAI Realtime API...");
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
          silence_duration_ms: 1200,
        },
        instructions: buildVoiceInstructions(agentProfile),
      }),
    });

    console.log("[VOICE-SESSION] status", sessionResp.status);

    if (!sessionResp.ok) {
      const errText = await sessionResp.text();
      console.error(`❌ OpenAI API error ${sessionResp.status}:`, errText);
      return new Response(JSON.stringify({ 
        error: "OpenAI session creation failed",
        upstream: sessionResp.status, 
        details: errText 
      }), {
        status: 502,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const session = await sessionResp.json();
    console.log("[VOICE-SESSION] Raw session response structure:", JSON.stringify(session).slice(0, 200));

    const token = session?.client_secret?.value;
    const expiresAt = session?.client_secret?.expires_at;

    console.log("[VOICE-SESSION] Token prefix:", token?.slice(0, 12));
    console.log("[VOICE-SESSION] Extracted token type:", typeof token);

    if (!token || typeof token !== "string" || token.length < 20) {
      console.error("❌ Invalid token from OpenAI:", { 
        hasToken: !!token, 
        type: typeof token,
        tokenLength: token?.length,
        structure: session?.client_secret 
      });
      return new Response(JSON.stringify({ 
        error: "No ephemeral token in OpenAI response", 
        got: session?.client_secret 
      }), {
        status: 500,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    console.log(`✅ Ephemeral token created: ${token.slice(0, 12)}...${token.slice(-4)}`);
    
    return new Response(JSON.stringify({ token, expiresAt }), {
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("❌ Voice session error:", e);
    return new Response(JSON.stringify({ 
      error: e instanceof Error ? e.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
