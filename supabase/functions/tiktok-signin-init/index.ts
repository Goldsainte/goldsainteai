// TikTok Sign-In Init v1.0
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://goldsainte.ai',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Vary': 'Origin',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🎵 TIKTOK SIGNIN INIT v1.0 - Starting flow');

    // Get TikTok credentials
    const clientKey = Deno.env.get('TIKTOK_CLIENT_KEY');
    const clientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET');

    if (!clientKey || !clientSecret) {
      console.error('TikTok credentials not configured');
      return new Response(
        JSON.stringify({ error: 'TikTok Sign-In not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('TikTok credentials found, generating state...');

    // Generate state for CSRF protection
    const state = crypto.randomUUID();
    console.log('Generated state:', state);
    
    // Capture app origin from query param or headers
    const url = new URL(req.url);
    const appOrigin = url.searchParams.get('origin') || 
                      req.headers.get('origin') || 
                      req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 
                      '';

    console.log('App origin:', appOrigin);

    // Store state in database
    const { error: stateError } = await supabaseClient
      .from('oauth_states')
      .insert({
        state,
        platform: 'tiktok',
        provider: 'tiktok',
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        app_origin: appOrigin
      });

    if (stateError) {
      console.error('Error storing state:', stateError);
      return new Response(
        JSON.stringify({ error: 'Failed to store state' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('State stored successfully in DB');

    // Build TikTok OAuth URL
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const redirectUri = `${supabaseUrl}/functions/v1/tiktok-signin-callback`;
    console.log('Using edge function redirect URI:', redirectUri);
    
    const authUrl = new URL('https://www.tiktok.com/v2/auth/authorize/');
    authUrl.searchParams.set('client_key', clientKey);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'user.info.basic');
    authUrl.searchParams.set('state', state);

    console.log('Redirecting to TikTok OAuth with state cookie set');

    // Set HttpOnly cookie and redirect to TikTok (302)
    return new Response(null, {
      status: 302,
      headers: {
        'Location': authUrl.toString(),
        'Set-Cookie': `tiktok_state=${state}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=600`,
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Error in tiktok-signin-init:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
