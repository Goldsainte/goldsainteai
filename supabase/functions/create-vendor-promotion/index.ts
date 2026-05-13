import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Not authenticated');
    }

    const {
      vendorId,
      promotionType,
      campaignName,
      campaignDescription,
      startDate,
      endDate,
      dailyBudget,
      totalBudget,
      discountCode,
      discountPercentage,
      specialOfferText,
      targetLocations,
      targetTripTypes,
      promotionalImageUrl,
    } = await req.json();

    console.log('Creating vendor promotion:', { vendorId, promotionType, campaignName });

    // Verify vendor ownership
    const { data: vendor, error: vendorError } = await supabase
      .from('transportation_vendors')
      .select('*, supplier:suppliers!transportation_vendors_supplier_id_fkey(user_id)')
      .eq('id', vendorId)
      .single();

    if (vendorError || !vendor) {
      throw new Error('Vendor not found');
    }

    if (vendor.supplier.user_id !== user.id) {
      throw new Error('Unauthorized: You do not own this vendor');
    }

    // Create promotion record
    const { data: promotion, error: promotionError } = await supabase
      .from('vendor_promotions')
      .insert({
        vendor_id: vendorId,
        promotion_type: promotionType,
        campaign_name: campaignName,
        campaign_description: campaignDescription,
        start_date: startDate,
        end_date: endDate,
        daily_budget: dailyBudget,
        total_budget: totalBudget,
        discount_code: discountCode,
        discount_percentage: discountPercentage,
        special_offer_text: specialOfferText,
        target_locations: targetLocations || [],
        target_trip_types: targetTripTypes || [],
        promotional_image_url: promotionalImageUrl,
        is_active: true,
        payment_status: 'active',
      })
      .select()
      .single();

    if (promotionError) {
      console.error('Error creating promotion:', promotionError);
      throw promotionError;
    }

    // If promotion type is "promoted_vendor", update vendor record
    if (promotionType === 'promoted_vendor') {
      const { error: updateError } = await supabase
        .from('transportation_vendors')
        .update({
          is_promoted_vendor: true,
          promoted_until: endDate,
          featured_badge: 'Promoted Vendor',
        })
        .eq('id', vendorId);

      if (updateError) {
        console.error('Error updating vendor status:', updateError);
      }
    }

    console.log('Promotion created successfully:', promotion.id);

    return new Response(
      JSON.stringify({
        success: true,
        promotion,
        message: 'Promotion created successfully',
      }),
      {
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error in create-vendor-promotion:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
