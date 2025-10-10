import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { affiliateCode } = await req.json();

    if (!affiliateCode) {
      throw new Error('Affiliate code is required');
    }

    // Get affiliate link
    const { data: affiliateLink, error: linkError } = await supabaseClient
      .from('affiliate_links')
      .select('*')
      .eq('affiliate_code', affiliateCode)
      .eq('is_active', true)
      .single();

    if (linkError || !affiliateLink) {
      throw new Error('Invalid affiliate code');
    }

    // Get user if authenticated
    let userId = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data } = await supabaseClient.auth.getUser(token);
      userId = data.user?.id || null;
    }

    // Get IP and user agent
    const ipAddress = req.headers.get('x-forwarded-for') || 
                      req.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Record click
    const { error: clickError } = await supabaseClient
      .from('affiliate_clicks')
      .insert({
        affiliate_link_id: affiliateLink.id,
        user_id: userId,
        ip_address: ipAddress,
        user_agent: userAgent,
      });

    if (clickError) throw clickError;

    // Increment click count
    await supabaseClient
      .from('affiliate_links')
      .update({ clicks: affiliateLink.clicks + 1 })
      .eq('id', affiliateLink.id);

    console.log('Affiliate click tracked:', affiliateCode);

    return new Response(
      JSON.stringify({
        success: true,
        redirectUrl: affiliateLink.product_url,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error tracking affiliate click:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});