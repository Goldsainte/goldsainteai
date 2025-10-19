import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    console.log('Fetching Apple Sign-In credentials...');

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
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Credentials found, generating state...');

    // Generate state for CSRF protection
    const state = crypto.randomUUID();
    
    // Capture app origin for callback redirect
    const appOrigin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || '';

    // Store state in a temporary table
    const { error: stateError } = await supabaseClient
      .from('oauth_states')
      .insert({
        state,
        provider: 'apple',
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        app_origin: appOrigin
      });

    if (stateError) {
      console.error('Error storing state:', stateError);
    }

    // Build authorization URL - Apple will POST directly to edge function
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const redirectUri = `${supabaseUrl}/functions/v1/apple-signin-callback`;
    
    const authUrl = new URL('https://appleid.apple.com/auth/authorize');
    authUrl.searchParams.set('client_id', credentials.services_id);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code id_token');
    authUrl.searchParams.set('response_mode', 'form_post');
    authUrl.searchParams.set('scope', 'name email');
    authUrl.searchParams.set('state', state);

    console.log('Auth URL generated successfully');

    return new Response(
      JSON.stringify({ 
        authUrl: authUrl.toString(),
        state
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in apple-signin-init:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
