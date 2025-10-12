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

    // Create JWT token for Stream (works for both Chat and Activity Feeds)
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

    // Initialize feed groups if they don't exist (idempotent)
    try {
      console.log('[Stream Setup] Ensuring feed groups exist...');
      
      // Create server-side auth header
      const serverAuthHeader = `${apiKey} ${apiSecret}`;
      
      // Try to create 'user' feed group (will fail silently if exists)
      await fetch(`https://api.stream-io-api.com/api/v3.0/feed_groups`, {
        method: 'POST',
        headers: {
          'Authorization': serverAuthHeader,
          'Content-Type': 'application/json',
          'Stream-Auth-Type': 'jwt',
        },
        body: JSON.stringify({
          id: 'user',
          default_visibility: 'public',
        })
      }).catch(() => console.log('[Stream Setup] User feed group already exists'));

      // Try to create 'timeline' feed group (will fail silently if exists)
      await fetch(`https://api.stream-io-api.com/api/v3.0/feed_groups`, {
        method: 'POST',
        headers: {
          'Authorization': serverAuthHeader,
          'Content-Type': 'application/json',
          'Stream-Auth-Type': 'jwt',
        },
        body: JSON.stringify({
          id: 'timeline',
          default_visibility: 'public',
        })
      }).catch(() => console.log('[Stream Setup] Timeline feed group already exists'));

      console.log('[Stream Setup] Feed groups ensured');

      // Get or create user's feeds
      console.log(`[Stream Setup] Creating feeds for user: ${userId}`);
      
      // Create user feed
      const userFeedRes = await fetch(`https://api.stream-io-api.com/api/v3.0/feeds/user:${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': serverAuthHeader,
          'Content-Type': 'application/json',
          'Stream-Auth-Type': 'jwt',
        },
        body: JSON.stringify({
          user_id: userId,
        })
      });
      
      if (userFeedRes.ok) {
        console.log(`[Stream Setup] User feed created for ${userId}`);
      }

      // Create timeline feed
      const timelineFeedRes = await fetch(`https://api.stream-io-api.com/api/v3.0/feeds/timeline:${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': serverAuthHeader,
          'Content-Type': 'application/json',
          'Stream-Auth-Type': 'jwt',
        },
        body: JSON.stringify({
          user_id: userId,
        })
      });
      
      if (timelineFeedRes.ok) {
        console.log(`[Stream Setup] Timeline feed created for ${userId}`);
      }

      // Make timeline follow user feed
      await fetch(`https://api.stream-io-api.com/api/v1.0/feed/timeline/${userId}/follows/`, {
        method: 'POST',
        headers: {
          'Authorization': serverAuthHeader,
          'Content-Type': 'application/json',
          'Stream-Auth-Type': 'jwt',
        },
        body: JSON.stringify({
          target: `user:${userId}`,
          activity_copy_limit: 300,
        })
      });

      console.log(`[Stream Setup] Timeline following user feed for ${userId}`);
    } catch (setupError) {
      console.error('[Stream Setup] Error during setup:', setupError);
      // Continue anyway - feeds may already exist
    }

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
