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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code || !state) {
      throw new Error('Missing required OAuth parameters');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify state and get code_verifier
    const { data: oauthState, error: stateError } = await supabaseAdmin
      .from('oauth_states')
      .select('*')
      .eq('state', state)
      .eq('platform', 'etsy')
      .single();

    if (stateError || !oauthState) {
      throw new Error('Invalid or expired state token');
    }

    // Delete used state
    await supabaseAdmin.from('oauth_states').delete().eq('state', state);

    // Exchange code for tokens with PKCE
    const clientId = Deno.env.get('ETSY_CLIENT_ID');
    const clientSecret = Deno.env.get('ETSY_CLIENT_SECRET');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/etsy-oauth-callback`;

    const tokenResponse = await fetch('https://api.etsy.com/v3/public/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
        code_verifier: oauthState.code_verifier,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Etsy token exchange error:', error);
      throw new Error('Failed to exchange authorization code');
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokens;

    // Get shop details
    const etsyClientId = Deno.env.get('ETSY_CLIENT_ID');
    if (!etsyClientId) {
      throw new Error('ETSY_CLIENT_ID not configured');
    }
    
    const shopResponse = await fetch('https://api.etsy.com/v3/application/users/me', {
      headers: { 
        'Authorization': `Bearer ${access_token}`,
        'x-api-key': etsyClientId,
      },
    });

    const shopData = await shopResponse.json();
    const storeName = shopData.shop_name || oauthState.store_url;

    // Store connection
    const { error: connectionError } = await supabaseAdmin
      .from('ecommerce_connections')
      .upsert({
        creator_id: oauthState.user_id,
        platform: 'etsy',
        store_url: oauthState.store_url,
        store_name: storeName,
        access_token,
        refresh_token,
        token_expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
        is_active: true,
        sync_status: 'idle',
        metadata: { shop_id: shopData.shop_id },
      }, {
        onConflict: 'creator_id,platform',
      });

    if (connectionError) {
      console.error('Error storing connection:', connectionError);
      throw new Error('Failed to save connection');
    }

    console.log('Etsy connection saved for user:', oauthState.user_id);

    // Trigger initial sync in background
    supabaseAdmin.functions.invoke('sync-etsy-products', {
      body: { userId: oauthState.user_id },
    }).catch(err => console.error('Background sync error:', err));

    // Redirect back to app
    const appUrl = req.headers.get('referer') || Deno.env.get('APP_URL') || 'https://lovable.app';
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders(req),
        'Location': `${appUrl}/dashboard?etsy=connected`,
      },
    });

  } catch (error: unknown) {
    console.error('Error in etsy-oauth-callback:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const appUrl = req.headers.get('referer') || Deno.env.get('APP_URL') || 'https://lovable.app';
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders(req),
        'Location': `${appUrl}/dashboard?etsy=error&message=${encodeURIComponent(errorMessage)}`,
      },
    });
  }
});
