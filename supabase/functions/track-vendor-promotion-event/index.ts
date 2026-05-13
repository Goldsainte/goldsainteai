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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { vendorId, eventType, context } = await req.json();

    if (!vendorId || !eventType) {
      throw new Error('Missing required fields: vendorId, eventType');
    }

    const today = new Date().toISOString().split('T')[0];

    // Update or create analytics record for today
    const { data: existing } = await supabaseAdmin
      .from('vendor_promotion_analytics')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('date', today)
      .single();

    const updateData: any = {
      vendor_id: vendorId,
      date: today,
    };

    if (eventType === 'impression') {
      updateData.impressions = (existing?.impressions || 0) + 1;
    } else if (eventType === 'click') {
      updateData.clicks = (existing?.clicks || 0) + 1;
    } else if (eventType === 'profile_view') {
      updateData.profile_views = (existing?.profile_views || 0) + 1;
    } else if (eventType === 'booking_inquiry') {
      updateData.booking_inquiries = (existing?.booking_inquiries || 0) + 1;
    } else if (eventType === 'conversion') {
      updateData.conversions = (existing?.conversions || 0) + 1;
    }

    await supabaseAdmin
      .from('vendor_promotion_analytics')
      .upsert(updateData, { 
        onConflict: 'vendor_id,date',
        ignoreDuplicates: false 
      });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
