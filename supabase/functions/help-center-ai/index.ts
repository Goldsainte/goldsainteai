import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Strip technical routes from AI responses
const stripRoutes = (text: string): string => {
  return text
    // Remove parenthetical route references e.g. "(/travel-profile)"
    .replace(/\s*\(\/[^\)]+\)/g, '')
    // Remove "at /path", "visit /path", etc.
    .replace(/\s+(?:at|visit|go to|or visit|or go to)\s+\/[^\s\.,)]+/gi, '')
    // Remove any remaining naked "/path" strings
    .replace(/\/[a-z0-9\-\/\?=]+/gi, '')
    // Clean up extra spaces
    .replace(/\s{2,}/g, ' ')
    .trim();
};

const systemPrompt = `You are Goldsainte's AI Travel Assistant. You help users with travel-related questions, booking inquiries, destination recommendations, and trip planning.

## YOUR EXPERTISE:
You can assist with:
- **Destination Recommendations**: Suggest places based on interests, budget, season, and travel style
- **Travel Planning**: Help with itinerary planning, best times to visit, travel tips
- **Accommodation Advice**: Hotel recommendations, what to look for in accommodations
- **Budget Planning**: Estimate costs, find deals, understand what's included
- **Booking Help**: Guide through the booking process, explain policies
- **Travel Logistics**: Visa requirements, weather, transportation, packing tips
- **Local Insights**: Culture, cuisine, must-see attractions, hidden gems

## COMPANY INFORMATION:
- Goldsainte is an AI-powered luxury travel platform
- We offer hotels, flights, restaurants, and complete travel packages
- Expert travel agents available for complex bookings
- Features include AI voice search, personalized recommendations, and group bookings

## BOOKING POLICIES:
- Cancellations: Varies by booking, typically 24-48h notice required
- Refunds: Processed in 5-7 business days
- Payment: Secure payment processing via Stripe
- Support: Available via email at support@goldsainte.com

## RESPONSE GUIDELINES:
- Be friendly, enthusiastic, and helpful about travel
- Ask clarifying questions to better understand travel preferences
- Provide specific, actionable recommendations
- Keep answers concise (under 200 words) unless complex explanations needed
- Focus on the travel experience, not technical platform details
- If you can't help with something specific, suggest contacting support@goldsainte.com

## HANDLING SEARCH RESULTS:
**CRITICAL**: Only comment on search results AFTER receiving the actual filtered data. Your response must match the data returned.

When search results are available:
- **If status: "OK" & data.length > 0**: Acknowledge the results with the actual budget constraint used
  Example: "Here are options in [location] under [currency][amount]/night. Sorted by best value. I can widen search radius or adjust filters to find more."
  
- **If status: "NO_RESULTS"**: Explain why no results were found and suggest alternatives
  Example: "I couldn't find hotels under [currency][amount]/night on those dates. Typical prices in this area are [currency][range]. Want me to try +[currency]50, widen radius, or shift dates by ±1 day?"

**Never say** "I can't find hotels under X" if results are already showing. Base ALL statements on the actual filtered data returned.

## SAMPLE QUESTIONS YOU EXCEL AT:
- "What are the best destinations for a beach vacation in December?"
- "How much should I budget for a week in Tokyo?"
- "What's the best time to visit Paris?"
- "Can you help me plan a 5-day Italy itinerary?"
- "What should I pack for a safari in Kenya?"
- "Are there any cultural customs I should know before visiting Thailand?"

Remember: You're a travel expert helping people plan their dream trips! Focus on inspiring travel experiences and practical advice.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

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
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service quota exceeded. Please contact support." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessageRaw = data.choices?.[0]?.message?.content;

    if (!assistantMessageRaw) {
      throw new Error("No response from AI");
    }

    // Strip any technical routes from the response
    const assistantMessage = stripRoutes(assistantMessageRaw);

    return new Response(
      JSON.stringify({ response: assistantMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Help Center AI error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
