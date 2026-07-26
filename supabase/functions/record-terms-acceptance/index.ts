import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { agentId, termsVersion, privacyVersion, vendorVersion } = await req.json();

    if (!agentId || !termsVersion || !privacyVersion || !vendorVersion) {
      throw new Error('Missing required fields');
    }

    // Get IP and user agent from request
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                      req.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Record acceptance — IDEMPOTENT (fixed Jul 26).
    // agent_terms_acceptance has UNIQUE(agent_id, terms_version), and this
    // used a plain INSERT followed by a travel_agents UPDATE. If the insert
    // succeeded but the update failed, every retry hit the unique constraint
    // — the applicant was permanently stuck at "Failed to record acceptance"
    // with no way past the agreement modal (founder report). Upserting on the
    // unique pair makes retries safe; re-accepting the same version is a
    // no-op, not an error.
    const { error: insertError } = await supabaseClient
      .from('agent_terms_acceptance')
      .upsert(
        {
          agent_id: agentId,
          terms_version: termsVersion,
          privacy_version: privacyVersion,
          vendor_version: vendorVersion,
          ip_address: ipAddress,
          user_agent: userAgent
        },
        { onConflict: 'agent_id,terms_version', ignoreDuplicates: true }
      );

    if (insertError) throw insertError;

    // Update agent record
    const { error: updateError } = await supabaseClient
      .from('travel_agents')
      .update({
        terms_accepted: true,
        terms_accepted_at: new Date().toISOString(),
        terms_version: termsVersion
      })
      .eq('id', agentId);

    if (updateError) throw updateError;

    console.log(`Terms accepted by agent ${agentId}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Terms accepted successfully' }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error recording terms acceptance:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
