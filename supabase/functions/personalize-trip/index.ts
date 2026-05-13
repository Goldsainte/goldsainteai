import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "https://goldsainte.ai",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PersonalizeBody {
  trip: {
    title: string;
    destination: string;
    duration_days: number;
    description?: string;
  };
  baseItinerary: Array<{
    day_number: number;
    title: string;
    description?: string | null;
    accommodation?: string | null;
  }>;
  modifiers: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { trip, baseItinerary, modifiers }: PersonalizeBody = await req.json();

    if (!trip || !Array.isArray(baseItinerary) || !Array.isArray(modifiers)) {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a luxury travel concierge for Goldsainte, an editorial creator-powered marketplace.
You take a base itinerary and re-imagine it through the lens of the traveler's chosen modifiers (e.g. Slower Pace, Wellness Focus, Luxury Upgrade, Food & Wine, Adventure).
Tone: editorial, restrained, evocative — like Condé Nast Traveler. Avoid superlatives, avoid emojis.
Output STRICT JSON matching the provided tool schema. Keep day count identical to the base itinerary.`;

    const userPrompt = `Trip: ${trip.title} in ${trip.destination} (${trip.duration_days} days)
${trip.description ? `Context: ${trip.description}\n` : ""}
Selected modifiers: ${modifiers.join(", ") || "(none)"}

Base itinerary:
${baseItinerary.map((d) => `Day ${d.day_number} — ${d.title}${d.description ? `: ${d.description}` : ""}${d.accommodation ? ` [Stay: ${d.accommodation}]` : ""}`).join("\n")}

Re-cast each day to reflect the modifiers. Update accommodation, hero activity, dining, and pace. Add a one-line price impact note (e.g. "+12% for upgraded suites").`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "render_personalized_itinerary",
              description: "Return the re-imagined itinerary",
              parameters: {
                type: "object",
                properties: {
                  headline: { type: "string", description: "One-line editorial headline for the personalized version" },
                  price_impact: { type: "string", description: "Soft estimate, e.g. '+8% for upgraded stays'" },
                  days: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        day_number: { type: "number" },
                        title: { type: "string" },
                        description: { type: "string" },
                        accommodation: { type: "string" },
                        hero_activity: { type: "string" },
                        dining: { type: "string" },
                      },
                      required: ["day_number", "title", "description", "accommodation", "hero_activity", "dining"],
                    },
                  },
                },
                required: ["headline", "price_impact", "days"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "render_personalized_itinerary" } },
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("OpenAI error", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await response.json();
    const toolCall = json.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No structured response" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const variant = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify({ variant }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("personalize-trip error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});