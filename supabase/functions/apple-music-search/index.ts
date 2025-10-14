import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get platform credentials from database
async function getCredentials() {
  console.log('[apple-music-search] Fetching platform credentials');
  
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { data, error } = await supabaseAdmin
    .from('apple_music_credentials')
    .select('p8_key, team_id, key_id')
    .limit(1)
    .single();

  if (error || !data) {
    console.error('[apple-music-search] Error fetching credentials:', error);
    throw new Error('Apple Music credentials not configured');
  }

  console.log('[apple-music-search] Credentials retrieved successfully');
  return data;
}

// Generate Apple Music JWT token
async function generateToken(privateKey: string, teamId: string, keyId: string): Promise<string> {
  console.log('[apple-music-search] Generating JWT with team_id:', teamId, 'key_id:', keyId);
  
  // Create JWT header
  const header = {
    alg: 'ES256',
    kid: keyId
  };

  // Create JWT payload
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: teamId,
    iat: now,
    exp: now + (6 * 30 * 24 * 60 * 60) // 6 months
  };

  console.log('[apple-music-search] JWT payload:', { iss: teamId, iat: now, exp: payload.exp });

  // Encode header and payload
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const message = `${encodedHeader}.${encodedPayload}`;

  // Import the private key - handle both EC and standard PRIVATE KEY formats
  const pemKey = privateKey
    .replace(/-----BEGIN (EC )?PRIVATE KEY-----/g, '')
    .replace(/-----END (EC )?PRIVATE KEY-----/g, '')
    .replace(/[\r\n\s]/g, '');
  
  console.log('[apple-music-search] Cleaned key length:', pemKey.length);
  
  const binaryKey = Uint8Array.from(atob(pemKey), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey.buffer,
    {
      name: 'ECDSA',
      namedCurve: 'P-256'
    },
    false,
    ['sign']
  );

  // Sign the message
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: { name: 'SHA-256' }
    },
    cryptoKey,
    encoder.encode(message)
  );

  // Encode signature
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)));
  
  console.log('[apple-music-search] JWT token generated, total length:', `${message}.${encodedSignature}`.length);
  return `${message}.${encodedSignature}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[apple-music-search] Function invoked');

    const { query } = await req.json();
    
    if (!query) {
      console.error('[apple-music-search] No query provided');
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[apple-music-search] Searching for:', query);

    // Get platform credentials
    let credentials;
    try {
      credentials = await getCredentials();
      console.log('[apple-music-search] Credentials retrieved:', {
        hasP8Key: !!credentials.p8_key,
        teamId: credentials.team_id,
        keyId: credentials.key_id
      });
    } catch (error) {
      console.error('[apple-music-search] Failed to get credentials:', error);
      throw new Error('Apple Music credentials not configured');
    }

    // Generate JWT token
    let token;
    try {
      console.log('[apple-music-search] Attempting JWT token generation');
      token = await generateToken(credentials.p8_key, credentials.team_id, credentials.key_id);
      console.log('[apple-music-search] JWT token generated successfully');
    } catch (error) {
      console.error('[apple-music-search] JWT generation failed:', error);
      throw new Error('Failed to generate Apple Music token');
    }

    // Search Apple Music API
    const searchUrl = `https://api.music.apple.com/v1/catalog/us/search?term=${encodeURIComponent(query)}&types=songs&limit=10`;
    console.log('[apple-music-search] Calling Apple Music API:', searchUrl);
    
    let response;
    try {
      response = await fetch(searchUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('[apple-music-search] Apple Music API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[apple-music-search] Apple Music API error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Apple Music API returned ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error('[apple-music-search] Failed to call Apple Music API:', error);
      throw new Error('Failed to connect to Apple Music service');
    }

    const data = await response.json();
    console.log('[apple-music-search] Apple Music API response data:', {
      hasResults: !!data.results,
      hasSongs: !!data.results?.songs,
      songCount: data.results?.songs?.data?.length || 0
    });
    
    // Transform Apple Music response to our format
    const tracks = data.results?.songs?.data?.map((song: any) => ({
      id: song.id,
      name: song.attributes.name,
      artist: song.attributes.artistName,
      album: song.attributes.albumName,
      albumArt: song.attributes.artwork?.url?.replace('{w}', '300').replace('{h}', '300') || null,
      previewUrl: song.attributes.previews?.[0]?.url || null,
      duration: song.attributes.durationInMillis / 1000, // Convert to seconds
      appleMusicUrl: song.attributes.url
    })) || [];

    console.log(`[apple-music-search] Successfully found ${tracks.length} tracks`);

    return new Response(
      JSON.stringify({ tracks }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[apple-music-search] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});