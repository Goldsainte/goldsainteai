import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://goldsainte.ai',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const shop = url.searchParams.get('shop');

    if (!code || !state || !shop) {
      throw new Error('Missing required OAuth parameters');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify state token
    const { data: oauthState, error: stateError } = await supabaseAdmin
      .from('oauth_states')
      .select('*')
      .eq('state', state)
      .eq('platform', 'shopify')
      .single();

    if (stateError || !oauthState) {
      throw new Error('Invalid or expired state token');
    }

    // Delete used state
    await supabaseAdmin.from('oauth_states').delete().eq('state', state);

    // Exchange code for access token
    const clientId = Deno.env.get('SHOPIFY_CLIENT_ID');
    const clientSecret = Deno.env.get('SHOPIFY_CLIENT_SECRET');

    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Shopify token exchange error:', error);
      throw new Error('Failed to exchange authorization code');
    }

    const { access_token } = await tokenResponse.json();

    // Fetch shop details
    const shopResponse = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
      headers: { 'X-Shopify-Access-Token': access_token },
    });

    const shopData = await shopResponse.json();
    const storeName = shopData.shop?.name || shop;

    // Store connection in database
    const { error: connectionError } = await supabaseAdmin
      .from('ecommerce_connections')
      .upsert({
        creator_id: oauthState.user_id,
        platform: 'shopify',
        store_url: shop,
        store_name: storeName,
        access_token,
        is_active: true,
        sync_status: 'idle',
      }, {
        onConflict: 'creator_id,platform',
      });

    if (connectionError) {
      console.error('Error storing connection:', connectionError);
      throw new Error('Failed to save connection');
    }

    console.log('Shopify connection saved for user:', oauthState.user_id);

    // Trigger initial sync in background
    supabaseAdmin.functions.invoke('sync-shopify-products', {
      body: { userId: oauthState.user_id },
    }).catch(err => console.error('Background sync error:', err));

    // Redirect back to app
    const appUrl = req.headers.get('referer') || Deno.env.get('APP_URL') || 'https://lovable.app';
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': `${appUrl}/dashboard?shopify=connected`,
      },
    });

  } catch (error: unknown) {
    console.error('Error in shopify-oauth-callback:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const appUrl = req.headers.get('referer') || Deno.env.get('APP_URL') || 'https://lovable.app';
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': `${appUrl}/dashboard?shopify=error&message=${encodeURIComponent(errorMessage)}`,
      },
    });
  }
});
