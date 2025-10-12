import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { create } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, userName, userImage } = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
    }

    const apiKey = Deno.env.get('STREAM_API_KEY');
    const apiSecret = Deno.env.get('STREAM_API_SECRET');

    if (!apiKey || !apiSecret) {
      throw new Error('Stream credentials not configured');
    }

    // Create JWT token for Stream
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(apiSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const token = await create(
      { alg: "HS256", typ: "JWT" },
      { user_id: userId },
      key
    );

    console.log(`Generated Stream token for user: ${userId}`);

    return new Response(
      JSON.stringify({ 
        token,
        apiKey,
        userId,
        userName: userName || userId,
        userImage: userImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating Stream token:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
