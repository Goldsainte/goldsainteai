import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const TIKTOK_CLIENT_KEY = Deno.env.get('TIKTOK_CLIENT_KEY')!;
    const TIKTOK_CLIENT_SECRET = Deno.env.get('TIKTOK_CLIENT_SECRET')!;
    const APP_URL = Deno.env.get('APP_URL') || 'http://localhost:8080';

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    console.log('TikTok callback received:', { code: !!code, state, error });

    // Handle error from TikTok
    if (error) {
      console.error('TikTok OAuth error:', error);
      return Response.redirect(
        `${APP_URL}/tiktok-callback?error=${encodeURIComponent(error)}`,
        302
      );
    }

    // Validate required parameters
    if (!code || !state) {
      console.error('Missing code or state parameter');
      return Response.redirect(
        `${APP_URL}/tiktok-callback?error=missing_parameters`,
        302
      );
    }

    // Verify state to prevent CSRF
    const { data: stateRecord, error: stateError } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state', state)
      .eq('provider', 'tiktok')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (stateError || !stateRecord) {
      console.error('Invalid or expired state:', stateError);
      return Response.redirect(
        `${APP_URL}/tiktok-callback?error=invalid_state`,
        302
      );
    }

    // Delete the used state
    await supabase.from('oauth_states').delete().eq('id', stateRecord.id);

    // Exchange code for access token
    const redirectUri = `${SUPABASE_URL}/functions/v1/tiktok-oauth-callback`;
    
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: TIKTOK_CLIENT_KEY,
        client_secret: TIKTOK_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();
    console.log('Token exchange response:', { success: tokenResponse.ok });

    if (!tokenResponse.ok || tokenData.error) {
      console.error('Token exchange failed:', tokenData);
      return Response.redirect(
        `${APP_URL}/tiktok-callback?error=token_exchange_failed`,
        302
      );
    }

    const { access_token, refresh_token, expires_in } = tokenData;
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    // If user was logged in during OAuth start, update their profile
    if (stateRecord.user_id) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          tiktok_access_token: access_token,
          tiktok_refresh_token: refresh_token,
          tiktok_token_expires_at: expiresAt,
          tiktok_connected_at: new Date().toISOString(),
        })
        .eq('id', stateRecord.user_id);

      if (updateError) {
        console.error('Failed to update profile:', updateError);
        return Response.redirect(
          `${APP_URL}/tiktok-callback?error=update_failed`,
          302
        );
      }

      console.log('Successfully connected TikTok for user:', stateRecord.user_id);
      return Response.redirect(`${APP_URL}/tiktok-callback?success=true`, 302);
    } else {
      // No user was logged in - redirect with error
      return Response.redirect(
        `${APP_URL}/tiktok-callback?error=not_logged_in`,
        302
      );
    }
  } catch (error: any) {
    console.error('Error in tiktok-oauth-callback:', error);
    const APP_URL = Deno.env.get('APP_URL') || 'http://localhost:8080';
    return Response.redirect(
      `${APP_URL}/tiktok-callback?error=server_error`,
      302
    );
  }
});
