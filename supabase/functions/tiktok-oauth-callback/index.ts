import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  "Vary": "Origin",
};
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
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

    // Default return path
    let returnTo = 'tiktok-lab';

    // Handle error from TikTok
    if (error) {
      console.error('TikTok OAuth error:', error);
      return Response.redirect(
        `${APP_URL}/tiktok-callback?error=${encodeURIComponent(error)}&return_to=${returnTo}`,
        302
      );
    }

    // Validate required parameters
    if (!code || !state) {
      console.error('Missing code or state parameter');
      return Response.redirect(
        `${APP_URL}/tiktok-callback?error=missing_parameters&return_to=${returnTo}`,
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
        `${APP_URL}/tiktok-callback?error=invalid_state&return_to=${returnTo}`,
        302
      );
    }

    // Get return_to from state metadata
    if (stateRecord.metadata?.return_to) {
      returnTo = stateRecord.metadata.return_to;
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
        `${APP_URL}/tiktok-callback?error=token_exchange_failed&return_to=${returnTo}`,
        302
      );
    }

    const { access_token, refresh_token, expires_in, open_id } = tokenData;
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    // Fetch user info including follower count
    let followerCount = 0;
    let tiktokUsername = '';
    
    try {
      const userInfoResponse = await fetch(
        'https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,follower_count,username',
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${access_token}`,
          },
        }
      );
      
      const userInfoData = await userInfoResponse.json();
      console.log('TikTok user info response:', { success: userInfoResponse.ok, data: userInfoData });
      
      if (userInfoResponse.ok && userInfoData.data?.user) {
        followerCount = userInfoData.data.user.follower_count || 0;
        tiktokUsername = userInfoData.data.user.username || userInfoData.data.user.display_name || '';
      }
    } catch (userInfoError) {
      console.error('Failed to fetch TikTok user info:', userInfoError);
      // Continue without follower count - not a blocking error
    }

    // If user was logged in during OAuth start, store tokens
    if (stateRecord.user_id) {
      // Store tokens in tiktok_tokens table
      const { error: upsertError } = await supabase
        .from('tiktok_tokens')
        .upsert({
          user_id: stateRecord.user_id,
          tiktok_user_id: open_id || tokenData.open_id,
          access_token,
          refresh_token,
          expires_at: expiresAt,
          follower_count: followerCount,
          username: tiktokUsername,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (upsertError) {
        console.error('Failed to store tokens:', upsertError);
        return Response.redirect(
          `${APP_URL}/tiktok-callback?error=update_failed&return_to=${returnTo}`,
          302
        );
      }

      // Update user's profile with verification status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          tiktok_verified: true,
          tiktok_follower_count: followerCount,
          tiktok_verified_at: new Date().toISOString(),
        })
        .eq('id', stateRecord.user_id);

      if (profileError) {
        console.error('Failed to update profile:', profileError);
        // Not blocking, continue with redirect
      }

      console.log('Successfully connected TikTok for user:', stateRecord.user_id, 'followers:', followerCount);
      return Response.redirect(
        `${APP_URL}/tiktok-callback?success=true&return_to=${encodeURIComponent(returnTo)}&followers=${followerCount}`,
        302
      );
    } else {
      // No user was logged in - redirect with error
      return Response.redirect(
        `${APP_URL}/tiktok-callback?error=not_logged_in&return_to=${returnTo}`,
        302
      );
    }
  } catch (error: unknown) {
    console.error('Error in tiktok-oauth-callback:', error);
    const APP_URL = Deno.env.get('APP_URL') || 'http://localhost:8080';
    return Response.redirect(
      `${APP_URL}/tiktok-callback?error=server_error`,
      302
    );
  }
});
