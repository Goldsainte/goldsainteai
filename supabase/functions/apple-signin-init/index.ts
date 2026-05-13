// Apple Sign-In Init v3.1 - force redeploy
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Vary': 'Origin',
};
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🍎 APPLE SIGNIN INIT v3 - redirect + nocache');

    // Get Apple credentials from database
    const { data: credentials, error: credError } = await supabaseClient
      .from('apple_signin_credentials')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (credError || !credentials) {
      console.error('Error fetching credentials:', credError);
      return new Response(
        JSON.stringify({ error: 'Apple Sign-In not configured' }),
        { status: 500, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    console.log('Credentials found, generating state...');

    // Generate state for CSRF protection
    const state = crypto.randomUUID();
    console.log('Generated state:', state);
    
    // Capture app origin from query param or headers
    const url = new URL(req.url);
    const appOrigin = url.searchParams.get('origin') || 
                      req.headers.get('origin') || 
                      req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 
                      '';

    // Store state in database with both platform and provider for compatibility
    const { error: stateError } = await supabaseClient
      .from('oauth_states')
      .insert({
        state,
        platform: 'apple',
        provider: 'apple',
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        app_origin: appOrigin
      });

    if (stateError) {
      console.error('Error storing state:', stateError);
      return new Response(
        JSON.stringify({ error: 'Failed to store state' }),
        { status: 500, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    console.log('State stored successfully in DB');

    // Always redirect to edge function (Apple POSTs directly to it)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const redirectUri = `${supabaseUrl}/functions/v1/apple-signin-callback`;
    console.log('Using edge function redirect URI:', redirectUri);
    
    const authUrl = new URL('https://appleid.apple.com/auth/authorize');
    authUrl.searchParams.set('client_id', credentials.services_id);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code id_token');
    authUrl.searchParams.set('response_mode', 'form_post');
    authUrl.searchParams.set('scope', 'name email');
    authUrl.searchParams.set('state', state);

    console.log('Redirecting to Apple with state cookie set');

    // Set HttpOnly cookie and redirect to Apple (302)
    return new Response(null, {
      status: 302,
      headers: {
        'Location': authUrl.toString(),
        'Set-Cookie': `apple_state=${state}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=600`,
        ...corsHeaders(req)
      }
    });
  } catch (error) {
    console.error('Error in apple-signin-init:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
