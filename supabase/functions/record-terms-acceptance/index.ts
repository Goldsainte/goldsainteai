import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://goldsainte.ai',
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

    const { agentId, termsVersion, privacyVersion, vendorVersion } = await req.json();

    if (!agentId || !termsVersion || !privacyVersion || !vendorVersion) {
      throw new Error('Missing required fields');
    }

    // Get IP and user agent from request
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                      req.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Record acceptance
    const { error: insertError } = await supabaseClient
      .from('agent_terms_acceptance')
      .insert({
        agent_id: agentId,
        terms_version: termsVersion,
        privacy_version: privacyVersion,
        vendor_version: vendorVersion,
        ip_address: ipAddress,
        user_agent: userAgent
      });

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
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error recording terms acceptance:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
