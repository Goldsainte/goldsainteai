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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { campaignId, interactionType } = await req.json();

    // Update campaign metrics
    if (interactionType === 'impression') {
      await supabaseAdmin.rpc('increment', {
        table_name: 'promotion_campaigns',
        id: campaignId,
        column_name: 'impressions'
      });
    } else if (interactionType === 'click') {
      await supabaseAdmin.rpc('increment', {
        table_name: 'promotion_campaigns',
        id: campaignId,
        column_name: 'clicks'
      });
    } else if (interactionType === 'conversion') {
      await supabaseAdmin.rpc('increment', {
        table_name: 'promotion_campaigns',
        id: campaignId,
        column_name: 'conversions'
      });
    }

    // Update daily analytics
    const today = new Date().toISOString().split('T')[0];
    const updateData = {
      campaign_id: campaignId,
      date: today,
      [interactionType === 'impression' ? 'impressions' : interactionType === 'click' ? 'clicks' : 'conversions']: 1
    };

    await supabaseAdmin
      .from('promotion_analytics')
      .upsert(updateData, { onConflict: 'campaign_id,date' });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});