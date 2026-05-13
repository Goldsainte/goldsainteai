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
    const { promoCode, packageId, sessionId } = await req.json();

    if (!promoCode || !packageId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user if authenticated
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabaseClient.auth.getUser(token);
      userId = user?.id || null;
    }

    // Track the click
    const { error: clickError } = await supabaseClient
      .from('promo_code_usage')
      .insert({
        promo_code: promoCode.toUpperCase(),
        package_id: packageId,
        user_id: userId,
        session_id: sessionId || crypto.randomUUID()
      });

    if (clickError) {
      console.error('Error tracking click:', clickError);
      // Don't fail the request if tracking fails
    }

    // Increment click count on promotion
    const { data: promotion } = await supabaseClient
      .from('influencer_promotions')
      .select('clicks')
      .eq('promo_code', promoCode.toUpperCase())
      .eq('package_id', packageId)
      .single();

    if (promotion) {
      await supabaseClient
        .from('influencer_promotions')
        .update({ clicks: (promotion.clicks || 0) + 1 })
        .eq('promo_code', promoCode.toUpperCase())
        .eq('package_id', packageId);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
