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
    const { storeUrl } = await req.json();
    
    if (!storeUrl) {
      throw new Error('Store URL is required');
    }

    const clientId = Deno.env.get('SHOPIFY_CLIENT_ID');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/shopify-oauth-callback`;
    
    if (!clientId) {
      throw new Error('Shopify credentials not configured');
    }

    // Validate and normalize store URL
    const normalizedStore = storeUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    // Generate secure state token
    const state = crypto.randomUUID();
    
    // Get user ID from auth header
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

    // Store state with user ID for verification in callback
    const { error: stateError } = await createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
      .from('oauth_states')
      .insert({
        state,
        user_id: user.id,
        platform: 'shopify',
        store_url: normalizedStore,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 min
      });

    if (stateError) {
      console.error('Error storing state:', stateError);
      throw new Error('Failed to initialize OAuth');
    }

    // Build Shopify OAuth URL
    const scopes = 'read_products,read_inventory';
    const oauthUrl = `https://${normalizedStore}/admin/oauth/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

    console.log('Shopify OAuth initiated for store:', normalizedStore);

    return new Response(JSON.stringify({ 
      authUrl: oauthUrl,
      state 
    }), {
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in shopify-oauth-initiate:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
