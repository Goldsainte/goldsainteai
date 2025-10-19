import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { encode as base64urlEncode } from 'https://deno.land/std@0.224.0/encoding/base64url.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function generateClientSecret(privateKey: string, keyId: string, teamId: string, clientId: string) {
  // Import the P8 private key
  const pemContents = privateKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    false,
    ['sign']
  );

  // Create JWT header
  const header = {
    alg: 'ES256',
    kid: keyId,
    typ: 'JWT'
  };

  // Create JWT payload
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: teamId,
    iat: now,
    exp: now + (86400 * 180), // 180 days (max allowed by Apple)
    aud: 'https://appleid.apple.com',
    sub: clientId
  };

  // Encode header and payload
  const encodedHeader = base64urlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = base64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const message = `${encodedHeader}.${encodedPayload}`;

  // Sign the message
  const signature = await crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: 'SHA-256',
    },
    cryptoKey,
    new TextEncoder().encode(message)
  );

  // Convert signature to DER format and then base64url encode
  const encodedSignature = base64urlEncode(new Uint8Array(signature));

  return `${message}.${encodedSignature}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get Apple credentials from database
    const { data: credentials, error: credError } = await supabaseClient
      .from('apple_signin_credentials')
      .select('*')
      .single();

    if (credError || !credentials) {
      console.error('Error fetching credentials:', credError);
      return new Response(
        JSON.stringify({ error: 'Apple Sign-In not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate client secret
    const clientSecret = await generateClientSecret(
      credentials.p8_key,
      credentials.key_id,
      credentials.team_id,
      credentials.services_id
    );

    // Generate state for CSRF protection
    const state = crypto.randomUUID();

    // Store state in a temporary table or use a short-lived session
    const { error: stateError } = await supabaseClient
      .from('oauth_states')
      .insert({
        state,
        provider: 'apple',
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
      });

    if (stateError) {
      console.error('Error storing state:', stateError);
    }

    // Build authorization URL
    const redirectUri = `${req.headers.get('origin')}/auth/callback/apple`;
    const authUrl = new URL('https://appleid.apple.com/auth/authorize');
    authUrl.searchParams.set('client_id', credentials.services_id);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code id_token');
    authUrl.searchParams.set('response_mode', 'form_post');
    authUrl.searchParams.set('scope', 'name email');
    authUrl.searchParams.set('state', state);

    return new Response(
      JSON.stringify({ 
        authUrl: authUrl.toString(),
        state,
        clientSecret // We'll need this for the callback
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in apple-signin-init:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
