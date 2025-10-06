import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tool definitions for hotel booking
const tools = [
  {
    type: "function",
    function: {
      name: "search_hotels",
      description: "Search for hotels based on location, dates, and preferences. Returns a list of available hotels.",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "City or location name (e.g., 'Paris', 'New York', 'London')"
          },
          checkIn: {
            type: "string",
            description: "Check-in date in YYYY-MM-DD format"
          },
          checkOut: {
            type: "string",
            description: "Check-out date in YYYY-MM-DD format"
          },
          adults: {
            type: "integer",
            description: "Number of adult guests (default: 2)",
            default: 2
          }
        },
        required: ["location", "checkIn", "checkOut"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "book_hotel",
      description: "Book a hotel after the user confirms their selection. Requires hotel details and guest information.",
      parameters: {
        type: "object",
        properties: {
          hotelId: {
            type: "string",
            description: "The unique identifier of the hotel to book"
          },
          hotelName: {
            type: "string",
            description: "Name of the hotel"
          },
          checkIn: {
            type: "string",
            description: "Check-in date in YYYY-MM-DD format"
          },
          checkOut: {
            type: "string",
            description: "Check-out date in YYYY-MM-DD format"
          },
          guestFirstName: {
            type: "string",
            description: "Guest's first name"
          },
          guestLastName: {
            type: "string",
            description: "Guest's last name"
          },
          guestEmail: {
            type: "string",
            description: "Guest's email address"
          },
          guestPhone: {
            type: "string",
            description: "Guest's phone number"
          },
          totalPrice: {
            type: "number",
            description: "Total price for the booking"
          }
        },
        required: ["hotelId", "hotelName", "checkIn", "checkOut", "guestFirstName", "guestLastName", "guestEmail", "totalPrice"],
        additionalProperties: false
      }
    }
  }
];

// Handle tool calls
async function handleToolCall(toolName: string, args: any): Promise<any> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  console.log(`Executing tool: ${toolName}`, args);

  if (toolName === "search_hotels") {
    // Call unified-search-hotels
    const response = await fetch(`${supabaseUrl}/functions/v1/unified-search-hotels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        location: args.location,
        checkIn: args.checkIn,
        checkOut: args.checkOut,
        guests: args.adults || 2
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Hotel search error:', error);
      return { error: 'Failed to search hotels. Please try again.' };
    }

    const data = await response.json();
    
    // Format results for AI
    const hotels = data.results?.slice(0, 5).map((hotel: any) => ({
      id: hotel.id,
      name: hotel.title,
      location: hotel.location,
      pricePerNight: hotel.price,
      rating: hotel.rating,
      description: hotel.description?.substring(0, 200),
      amenities: hotel.amenities?.slice(0, 5)
    })) || [];

    return {
      success: true,
      hotels,
      message: `Found ${hotels.length} hotels in ${args.location}`
    };
  }

  if (toolName === "book_hotel") {
    const supabase = createClient(supabaseUrl!, supabaseKey!);
    
    // Generate booking reference
    const bookingReference = `HOTEL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create booking in database
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        booking_type: 'hotel',
        booking_reference: bookingReference,
        status: 'confirmed',
        total_price: args.totalPrice,
        currency: 'USD',
        booking_data: {
          hotelId: args.hotelId,
          hotelName: args.hotelName,
          checkIn: args.checkIn,
          checkOut: args.checkOut,
          guest: {
            firstName: args.guestFirstName,
            lastName: args.guestLastName,
            email: args.guestEmail,
            phone: args.guestPhone
          }
        }
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Booking error:', bookingError);
      return { 
        error: 'Failed to create booking. Please try again.',
        details: bookingError.message 
      };
    }

    return {
      success: true,
      bookingReference,
      bookingId: booking.id,
      message: `Hotel booked successfully! Confirmation: ${bookingReference}`
    };
  }

  return { error: 'Unknown tool' };
}

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

    const systemPrompt = `You are a luxury travel booking assistant for Goldsainte AI with the ability to search and book hotels.

CAPABILITIES:
- Search hotels in any location worldwide
- Book hotels directly when user confirms
- Provide detailed hotel information and recommendations

WORKFLOW FOR HOTEL BOOKINGS:
1. Ask for: destination, check-in/check-out dates, number of guests
2. Use search_hotels tool to find available hotels
3. Present top 3-5 options with names, prices, ratings, and key amenities
4. When user selects a hotel, collect: first name, last name, email, phone
5. Confirm all details before booking
6. Use book_hotel tool to complete the booking
7. Provide booking reference and confirmation

IMPORTANT RULES:
- Always search hotels before booking
- Never book without explicit user confirmation
- Always collect complete guest information before booking
- Present prices clearly with currency
- Mention cancellation policies when available
- Be conversational and luxury-focused

If user asks about flights, restaurants, or other services, politely explain those features are coming soon and offer to help with hotel bookings.`;

      // First API call with tools
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
          tools,
          stream: false, // Disable streaming for tool calls
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

      const aiResponse = await response.json();
      const assistantMessage = aiResponse.choices[0].message;

      // Check if AI wants to call a tool
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        console.log('AI requested tool calls:', assistantMessage.tool_calls);
        
        // Execute all tool calls
        const toolResults = await Promise.all(
          assistantMessage.tool_calls.map(async (toolCall: any) => {
            const args = JSON.parse(toolCall.function.arguments);
            const result = await handleToolCall(toolCall.function.name, args);
            return {
              tool_call_id: toolCall.id,
              role: "tool",
              name: toolCall.function.name,
              content: JSON.stringify(result)
            };
          })
        );

        // Second API call with tool results - this time with streaming
        const updatedMessages = [
          { role: "system", content: systemPrompt },
          ...messages,
          assistantMessage,
          ...toolResults
        ];

        const streamResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: updatedMessages,
            stream: true,
          }),
        });

        if (!streamResponse.ok) {
          throw new Error('Failed to get streaming response after tool execution');
        }

        return new Response(streamResponse.body, {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
        });
      }

      // No tool calls, return the assistant's message as stream
      const content = assistantMessage.content || "I'm here to help you book hotels. What destination are you interested in?";
      
      // Create a simple SSE stream
      const stream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();
          const chunk = {
            choices: [{
              delta: { content },
              index: 0,
              finish_reason: "stop"
            }]
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      });

      return new Response(stream, {
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
