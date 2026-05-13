import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const { p8_key, key_id, team_id } = await req.json();

    if (!p8_key || !key_id || !team_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required credentials' }),
        { status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[SAVE-CREDENTIALS] Saving credentials for user: ${user.id}`);

    // Upsert credentials
    const { error: upsertError } = await supabaseClient
      .from('apple_music_credentials')
      .upsert({
        user_id: user.id,
        p8_key,
        key_id,
        team_id,
      }, {
        onConflict: 'user_id'
      });

    if (upsertError) {
      console.error('[SAVE-CREDENTIALS] Error saving credentials:', upsertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save credentials' }),
        { status: 500, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    console.log('[SAVE-CREDENTIALS] Credentials saved successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Credentials saved successfully' }),
      { status: 200, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[SAVE-CREDENTIALS] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
