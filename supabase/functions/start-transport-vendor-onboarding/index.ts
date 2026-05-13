import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://goldsainte.ai',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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

    // Get authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[start-transport-vendor-onboarding] User:', user.id);

    // Check for existing supplier
    const { data: existingSupplier, error: supplierCheckError } = await supabaseClient
      .from('suppliers')
      .select('id, supplier_type')
      .eq('user_id', user.id)
      .eq('supplier_type', 'transportation')
      .maybeSingle();

    if (supplierCheckError) {
      console.error('[start-transport-vendor-onboarding] Error checking supplier:', supplierCheckError);
      return new Response(
        JSON.stringify({ error: 'Database error checking supplier', details: supplierCheckError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let supplierId: string;

    if (existingSupplier) {
      console.log('[start-transport-vendor-onboarding] Supplier exists:', existingSupplier.id);
      supplierId = existingSupplier.id;
    } else {
      // Create minimal supplier record
      const { data: newSupplier, error: supplierInsertError } = await supabaseClient
        .from('suppliers')
        .insert({
          user_id: user.id,
          supplier_type: 'transportation',
          business_name: 'My Transport Service',
          status: 'draft',
          rating: 0,
          total_reviews: 0,
          is_verified: false,
          verification_status: 'pending',
        })
        .select()
        .single();

      if (supplierInsertError) {
        console.error('[start-transport-vendor-onboarding] Error creating supplier:', supplierInsertError);
        return new Response(
          JSON.stringify({ error: 'Failed to create supplier', details: supplierInsertError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('[start-transport-vendor-onboarding] Created supplier:', newSupplier.id);
      supplierId = newSupplier.id;
    }

    // Check for existing transportation_vendors record
    const { data: existingVendor, error: vendorCheckError } = await supabaseClient
      .from('transportation_vendors')
      .select('id')
      .eq('supplier_id', supplierId)
      .maybeSingle();

    if (vendorCheckError) {
      console.error('[start-transport-vendor-onboarding] Error checking vendor:', vendorCheckError);
    }

    if (!existingVendor) {
      // Create minimal transportation vendor record
      const { error: vendorInsertError } = await supabaseClient
        .from('transportation_vendors')
        .insert({
          supplier_id: supplierId,
          service_areas: [],
          vehicle_types: [],
          base_hourly_rate: 0,
          total_vehicles: 0,
          available_vehicles: 0,
          on_time_percentage: 0,
          insurance_verified: false,
          license_verified: false,
        });

      if (vendorInsertError) {
        console.error('[start-transport-vendor-onboarding] Error creating vendor:', vendorInsertError);
        return new Response(
          JSON.stringify({ error: 'Failed to create vendor record', details: vendorInsertError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('[start-transport-vendor-onboarding] Created vendor for supplier:', supplierId);
    } else {
      console.log('[start-transport-vendor-onboarding] Vendor already exists');
    }

    return new Response(
      JSON.stringify({ success: true, supplier_id: supplierId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('[start-transport-vendor-onboarding] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
