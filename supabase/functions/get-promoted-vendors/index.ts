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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { displayContext, limit = 3 } = await req.json();

    // Get active promoted vendors (Silver, Gold, Platinum tiers only)
    const { data: subscriptions } = await supabaseAdmin
      .from('vendor_promotion_subscriptions')
      .select(`
        vendor_id,
        tier,
        transportation_vendors!inner(
          id,
          business_name,
          service_areas,
          verification_status
        )
      `)
      .in('tier', ['silver', 'gold', 'platinum'])
      .eq('status', 'active')
      .eq('transportation_vendors.verification_status', 'approved')
      .order('tier', { ascending: false })
      .limit(limit * 2);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ vendors: [] }), {
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Get vendor details with media and packages
    const vendorIds = subscriptions.map(s => s.vendor_id);

    const { data: media } = await supabaseAdmin
      .from('vendor_promotional_media')
      .select('*')
      .in('vendor_id', vendorIds)
      .order('display_order', { ascending: true });

    const { data: packages } = await supabaseAdmin
      .from('vendor_promotional_packages')
      .select('*')
      .in('vendor_id', vendorIds)
      .eq('is_active', true)
      .order('promotional_price', { ascending: true });

    // Get supplier ratings
    const { data: vendors } = await supabaseAdmin
      .from('transportation_vendors')
      .select(`
        id,
        business_name,
        service_areas,
        supplier_id,
        suppliers!inner(
          rating,
          total_reviews
        )
      `)
      .in('id', vendorIds);

    // Combine data
    const promotedVendors = subscriptions.slice(0, limit).map((sub: any) => {
      const tvData = sub.transportation_vendors;
      const vendor = vendors?.find((v: any) => v.id === sub.vendor_id);
      const vendorMedia = media?.filter((m: any) => m.vendor_id === sub.vendor_id) || [];
      const vendorPackages = packages?.filter((p: any) => p.vendor_id === sub.vendor_id) || [];

      const supplierData = Array.isArray(vendor?.suppliers) ? vendor.suppliers[0] : vendor?.suppliers;
      
      return {
        id: sub.vendor_id,
        businessName: tvData?.business_name || 'Unknown',
        rating: supplierData?.rating || 0,
        totalReviews: supplierData?.total_reviews || 0,
        serviceAreas: tvData?.service_areas || [],
        promotionalMedia: vendorMedia.map(m => ({
          url: m.file_url,
          caption: m.caption || '',
          isCover: m.is_cover || false,
        })),
        packages: vendorPackages.map(p => ({
          packageName: p.package_name,
          description: p.description,
          regularPrice: p.regular_price,
          promotionalPrice: p.promotional_price,
          discountPercentage: Math.round(((p.regular_price - p.promotional_price) / p.regular_price) * 100),
        })),
        tier: sub.tier,
      };
    });

    return new Response(JSON.stringify({ vendors: promotedVendors }), {
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error fetching promoted vendors:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
