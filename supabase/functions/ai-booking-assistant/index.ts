import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for AI responses

    try {
      const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a luxury travel booking assistant for Goldsainte AI. 
Your role is to help customers set up their booking preferences and understand their travel needs.

You can help with:
- Hotel preferences (star rating, amenities, price range)
- Flight preferences (cabin class, airlines, seat preferences)
- Dietary restrictions and accessibility needs
- Special requests and occasions
- Auto-booking settings

Be conversational, helpful, and luxury-focused. Ask clarifying questions to understand their preferences better.

IMPORTANT: After you have gathered all the necessary information about their trip (destination, dates, preferences, budget, etc.), you MUST present them with these three booking options:

1. **Let Goldsainte AI book your trip** - Our AI will automatically find and book the best options based on your preferences
2. **Book it yourself** - Browse and select your own hotels, flights, and activities from our curated selections
3. **Have a certified Goldsainte agent compile your trip** - Work with one of our expert travel agents who will personally curate and manage your booking

Ask them clearly: "How would you like to proceed with your booking?" and explain each option briefly.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: true,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        return new Response(JSON.stringify({ error: "AI gateway error" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    } catch (err: any) {
      clearTimeout(timeoutId);
      
      if (err.name === 'AbortError') {
        console.error("AI request timeout");
        return new Response(JSON.stringify({ error: "Request timed out. Please try again." }), {
          status: 408,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw err;
    }
  } catch (error) {
    console.error("AI booking assistant error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
