import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  "Vary": "Origin",
};
}

interface SupplierApplication {
  name: string;
  supplierType: string;
  businessName: string;
  businessRegistrationNumber?: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  address?: any;
  description: string;
  servicesOffered: string[];
  certifications?: string[];
  commissionRate?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const applicationData: SupplierApplication = await req.json();

    // Validate required fields
    if (!applicationData.name || !applicationData.supplierType || !applicationData.contactEmail) {
      throw new Error('Missing required fields');
    }

    // Check for existing supplier with same email
    const { data: existing } = await supabaseClient
      .from('suppliers')
      .select('id')
      .eq('contact_email', applicationData.contactEmail)
      .single();

    if (existing) {
      throw new Error('A supplier with this email already exists');
    }

    // Create supplier record
    const { data: supplier, error: supplierError } = await supabaseClient
      .from('suppliers')
      .insert({
        name: applicationData.name,
        supplier_type: applicationData.supplierType,
        business_name: applicationData.businessName,
        business_registration_number: applicationData.businessRegistrationNumber,
        contact_email: applicationData.contactEmail,
        contact_phone: applicationData.contactPhone,
        website: applicationData.website,
        address: applicationData.address || {},
        description: applicationData.description,
        services_offered: applicationData.servicesOffered,
        certifications: applicationData.certifications || [],
        commission_rate: applicationData.commissionRate || 10.00,
        verification_status: 'pending',
        is_active: false
      })
      .select()
      .single();

    if (supplierError) {
      console.error('Supplier creation error:', supplierError);
      throw new Error('Failed to create supplier application');
    }

    // Create initial vetting record
    await supabaseClient
      .from('supplier_vetting')
      .insert({
        supplier_id: supplier.id,
        background_check_status: 'pending',
        license_check_status: 'pending',
        insurance_check_status: 'pending',
        reference_check_status: 'pending'
      });

    // Notify admins
    const { data: admins } = await supabaseClient
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (admins && admins.length > 0) {
      const notifications = admins.map(admin => ({
        user_id: admin.user_id,
        type: 'supplier_application',
        title: 'New Supplier Application',
        message: `${applicationData.name} has applied as a ${applicationData.supplierType}`,
        entity_type: 'supplier',
        entity_id: supplier.id,
        action_url: '/admin/suppliers'
      }));

      await supabaseClient
        .from('notifications')
        .insert(notifications);
    }

    console.log(`Supplier application submitted: ${supplier.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        supplierId: supplier.id,
        message: 'Application submitted successfully. We will review it and contact you soon.'
      }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error submitting supplier application:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
