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
    );

    const {
      location,
      vehicleType,
      amenities,
      minPrice,
      maxPrice,
      promotedOnly,
      limit = 20,
      offset = 0,
    } = await req.json();

    console.log('Searching vendors with filters:', {
      location,
      vehicleType,
      amenities,
      minPrice,
      maxPrice,
      promotedOnly,
    });

    // Build query
    let query = supabase
      .from('transportation_vendors')
      .select(`
        *,
        supplier:suppliers!transportation_vendors_supplier_id_fkey(
          id,
          business_name,
          contact_email,
          contact_phone,
          description,
          logo_url,
          rating,
          total_reviews,
          is_verified
        ),
        fleet:vendor_fleet(count)
      `);

    // Filter by location (service areas)
    if (location) {
      query = query.contains('service_areas', [location]);
    }

    // Filter by vehicle type
    if (vehicleType) {
      query = query.contains('vehicle_types', [vehicleType]);
    }

    // Filter by price range
    if (minPrice) {
      query = query.gte('base_hourly_rate', minPrice);
    }
    if (maxPrice) {
      query = query.lte('base_hourly_rate', maxPrice);
    }

    // Filter by promoted status
    if (promotedOnly) {
      query = query.eq('is_promoted_vendor', true);
    }

    // Order by promoted first, then rating
    query = query
      .order('is_promoted_vendor', { ascending: false })
      .order('supplier(rating)', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: vendors, error } = await query;

    if (error) {
      console.error('Error searching vendors:', error);
      throw error;
    }

    // If amenities filter provided, filter fleet
    let results = vendors;
    if (amenities && amenities.length > 0) {
      const vendorIds = vendors?.map((v) => v.id) || [];
      
      const { data: fleetWithAmenities } = await supabase
        .from('vendor_fleet')
        .select('vendor_id')
        .in('vendor_id', vendorIds)
        .contains('amenities', amenities);

      const vendorIdsWithAmenities = new Set(
        fleetWithAmenities?.map((f) => f.vendor_id) || []
      );

      results = vendors?.filter((v) => vendorIdsWithAmenities.has(v.id)) || [];
    }

    console.log(`Found ${results?.length || 0} vendors`);

    return new Response(
      JSON.stringify({
        vendors: results || [],
        total: results?.length || 0,
      }),
      {
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error in search-transportation-vendors:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
