import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  "Vary": "Origin",
};
}

// PKCE helper functions
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const { shopName } = await req.json();
    
    if (!shopName) {
      throw new Error('Shop name is required');
    }

    const clientId = Deno.env.get('ETSY_CLIENT_ID');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/etsy-oauth-callback`;
    
    if (!clientId) {
      throw new Error('Etsy credentials not configured');
    }

    // Get user ID
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    // Generate PKCE codes
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = crypto.randomUUID();

    // Store state and code_verifier
    const { error: stateError } = await createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
      .from('oauth_states')
      .insert({
        state,
        user_id: user.id,
        platform: 'etsy',
        store_url: shopName,
        code_verifier: codeVerifier,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      });

    if (stateError) {
      console.error('Error storing state:', stateError);
      throw new Error('Failed to initialize OAuth');
    }

    // Build Etsy OAuth URL with PKCE
    const scope = 'listings_r';
    const oauthUrl = `https://www.etsy.com/oauth/connect?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

    console.log('Etsy OAuth initiated for shop:', shopName);

    return new Response(JSON.stringify({ 
      authUrl: oauthUrl,
      state 
    }), {
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in etsy-oauth-initiate:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
