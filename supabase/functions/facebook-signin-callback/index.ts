// Facebook Sign-In Callback v1.0
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  "Vary": "Origin",
};
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    console.log('🔵 FACEBOOK CALLBACK - Received request');
    
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    console.log('Facebook callback params:', { code: !!code, state, error, errorDescription });

    // Handle Facebook errors
    if (error) {
      console.error('Facebook OAuth error:', error, errorDescription);
      const errorRedirect = `${req.headers.get('referer') || 'https://goldsainte.ai'}/auth?error=${encodeURIComponent(error)}`;
      return new Response(null, {
        status: 302,
        headers: {
          'Location': errorRedirect,
          'Set-Cookie': 'facebook_state=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0',
          ...corsHeaders(req)
        }
      });
    }

    if (!code || !state) {
      console.error('Missing code or state parameter');
      return new Response(
        JSON.stringify({ error: 'Missing code or state parameter' }),
        { status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validate state from database
    console.log('Validating state from database...');
    const { data: stateRecord, error: stateError } = await supabaseAdmin
      .from('oauth_states')
      .select('*')
      .eq('state', state)
      .eq('provider', 'facebook')
      .single();

    if (stateError || !stateRecord) {
      console.error('State validation failed:', stateError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired state' }),
        { status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    console.log('State validated successfully, app_origin:', stateRecord.app_origin);

    // Get Facebook credentials
    const appId = Deno.env.get('FACEBOOK_APP_ID');
    const appSecret = Deno.env.get('FACEBOOK_APP_SECRET');

    if (!appId || !appSecret) {
      console.error('Facebook credentials not configured');
      return new Response(
        JSON.stringify({ error: 'Facebook credentials not configured' }),
        { status: 500, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Exchange code for access token
    console.log('Exchanging code for access token...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const redirectUri = `${supabaseUrl}/functions/v1/facebook-signin-callback`;
    
    const tokenUrl = new URL('https://graph.facebook.com/v21.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', appId);
    tokenUrl.searchParams.set('client_secret', appSecret);
    tokenUrl.searchParams.set('code', code);
    tokenUrl.searchParams.set('redirect_uri', redirectUri);

    const tokenResponse = await fetch(tokenUrl.toString());
    const tokenData = await tokenResponse.json();

    console.log('Token exchange response:', { success: !!tokenData.access_token, error: tokenData.error });

    if (tokenData.error || !tokenData.access_token) {
      console.error('Token exchange failed:', tokenData.error);
      return new Response(
        JSON.stringify({ error: 'Failed to exchange code for token' }),
        { status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = tokenData.access_token;

    // Fetch user info from Facebook Graph API
    console.log('Fetching user info from Facebook...');
    const userInfoUrl = `https://graph.facebook.com/me?fields=id,email,name,picture&access_token=${accessToken}`;
    const userInfoResponse = await fetch(userInfoUrl);
    const userInfo = await userInfoResponse.json();

    console.log('Facebook user info:', { id: userInfo.id, email: userInfo.email, name: userInfo.name });

    if (!userInfo.email) {
      console.error('Email not provided by Facebook');
      return new Response(
        JSON.stringify({ error: 'Email permission required' }),
        { status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Check if user exists
    console.log('Checking if user exists with email:', userInfo.email);
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const foundUser = existingUser.users.find(u => u.email === userInfo.email);

    let userId: string;
    let accessTokenResponse: string;
    let refreshTokenResponse: string;

    if (foundUser) {
      console.log('User found, generating session...');
      userId = foundUser.id;
      
      // Generate magic link for existing user
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: userInfo.email,
      });

      if (linkError || !linkData) {
        console.error('Failed to generate magic link:', linkError);
        throw new Error('Failed to generate session');
      }

      // Extract tokens from the hashed_token
      accessTokenResponse = linkData.properties.hashed_token;
      refreshTokenResponse = linkData.properties.hashed_token;
    } else {
      console.log('Creating new user...');
      
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: userInfo.email,
        email_confirm: true,
        user_metadata: {
          name: userInfo.name,
          avatar_url: userInfo.picture?.data?.url,
          provider: 'facebook',
          facebook_id: userInfo.id,
        }
      });

      if (createError || !newUser.user) {
        console.error('Failed to create user:', createError);
        throw new Error('Failed to create user');
      }

      userId = newUser.user.id;
      console.log('User created successfully:', userId);

      // Generate session for new user
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: userInfo.email,
      });

      if (linkError || !linkData) {
        console.error('Failed to generate magic link:', linkError);
        throw new Error('Failed to generate session');
      }

      accessTokenResponse = linkData.properties.hashed_token;
      refreshTokenResponse = linkData.properties.hashed_token;
    }

    // Delete used state
    await supabaseAdmin.from('oauth_states').delete().eq('state', state);

    // Build redirect URL with tokens
    const appOrigin = stateRecord.app_origin || 'https://goldsainte.ai';
    const callbackUrl = `${appOrigin}/auth/callback`;
    
    console.log('Redirecting to:', callbackUrl);

    // Redirect with hash fragment (tokens in URL)
    const redirectUrl = `${callbackUrl}#access_token=${accessTokenResponse}&refresh_token=${refreshTokenResponse}&type=recovery`;

    return new Response(null, {
      status: 302,
      headers: {
        'Location': redirectUrl,
        'Set-Cookie': 'facebook_state=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0',
        ...corsHeaders(req)
      }
    });

  } catch (error) {
    console.error('Error in facebook-signin-callback:', error);
    const errorRedirect = `${req.headers.get('referer') || 'https://goldsainte.ai'}/auth?error=callback_failed`;
    return new Response(null, {
      status: 302,
      headers: {
        'Location': errorRedirect,
        'Set-Cookie': 'facebook_state=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0',
        ...corsHeaders(req)
      }
    });
  }
});
