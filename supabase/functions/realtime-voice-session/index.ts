import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
};

function buildVoiceInstructions(agentProfile: any): string {
  return `You are Madison, Goldsainte's AI Travel Concierge — a friendly, upbeat 27-year-old travel expert.
Speak in a bright, natural, conversational tone with short sentences and small pauses. Use contractions and sound confident, warm, and modern.
When you trigger live flight or hotel lookups, say: "Perfect! You'll see a few options below in the chat window."`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    console.log("[VOICE-SESSION] Start request");
    
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const session = await sessionResp.json();
    console.log("[VOICE-SESSION] Raw session response structure:", JSON.stringify(session).slice(0, 200));

    const token = session?.client_secret?.value;
    const expiresAt = session?.client_secret?.expires_at;

    console.log("[VOICE-SESSION] Token prefix:", token?.slice(0, 12));
    console.log("[VOICE-SESSION] Extracted token type:", typeof token);

    if (!token || typeof token !== "string" || !token.startsWith("sk-ephem_")) {
      console.error("❌ Invalid token from OpenAI:", { 
        hasToken: !!token, 
        type: typeof token, 
        structure: session?.client_secret 
      });
      return new Response(JSON.stringify({ 
        error: "No ephemeral token in OpenAI response", 
        got: session?.client_secret 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`✅ Ephemeral token created: ${token.slice(0, 12)}...${token.slice(-4)}`);
    
    return new Response(JSON.stringify({ token, expiresAt }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("❌ Voice session error:", e);
    return new Response(JSON.stringify({ 
      error: e instanceof Error ? e.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
