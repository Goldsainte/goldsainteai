import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { StreamChat } from "https://esm.sh/stream-chat@8.40.10";

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

    // Initialize Stream server-side client
    const serverClient = StreamChat.getInstance(apiKey, apiSecret);

    // Create or update user
    await serverClient.upsertUser({
      id: userId,
      name: userName || userId,
      image: userImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
    });

    // Generate user token
    const token = serverClient.createToken(userId);

    console.log(`Generated Stream token for user: ${userId}`);

    return new Response(
      JSON.stringify({ 
        token,
        apiKey,
        userId 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating Stream token:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
