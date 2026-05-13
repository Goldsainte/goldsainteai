import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://goldsainte.ai',
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
    const APP_URL = Deno.env.get('APP_URL') || 'http://localhost:8080';

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request body for return_to parameter
    let returnTo = 'tiktok-lab';
    try {
      const body = await req.json();
      if (body.return_to) {
        returnTo = body.return_to;
      }
    } catch {
      // No body or invalid JSON, use default
    }

    // Generate random state for CSRF protection
    const state = crypto.randomUUID();
    
    // Get user from Authorization header if provided
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    // Store state in database with return_to metadata
    await supabase.from('oauth_states').insert({
      state,
      provider: 'tiktok',
      user_id: userId,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
      metadata: { return_to: returnTo },
    });

    // Build TikTok authorization URL
    const redirectUri = `${SUPABASE_URL}/functions/v1/tiktok-oauth-callback`;
    const scope = 'user.info.basic,user.info.stats,video.publish';
    
    const authorizeUrl = `https://www.tiktok.com/v2/auth/authorize/?` +
      `client_key=${encodeURIComponent(TIKTOK_CLIENT_KEY)}` +
      `&scope=${encodeURIComponent(scope)}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${encodeURIComponent(state)}`;

    console.log('Generated TikTok OAuth URL with return_to:', returnTo);

    return new Response(
      JSON.stringify({ authorizeUrl }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error in tiktok-oauth-start:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to initiate TikTok OAuth' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
