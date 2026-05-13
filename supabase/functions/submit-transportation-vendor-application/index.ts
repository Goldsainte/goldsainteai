import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

console.log('[submit-transportation-vendor-application] v2025-01-15');

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://goldsainte.ai',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation schema
const ApplicationSchema = z.object({
  businessName: z.string().trim().min(1, "Business name is required").max(200),
  contactEmail: z.string().trim().email("Invalid email address").max(255),
  contactPhone: z.string().trim().optional().nullable(),
  businessAddress: z.string().trim().optional().nullable(),
  businessDescription: z.string().trim().optional().nullable(),
  yearsInBusiness: z.coerce.number().min(0).optional().nullable(),
  serviceAreas: z.array(z.any()).optional().default([]),
  totalDrivers: z.coerce.number().min(0).optional().nullable(),
  insurancePolicyNumber: z.string().trim().optional().nullable(),
  insuranceExpiryDate: z.string().optional().nullable(),
  insuranceCoverageAmount: z.coerce.number().optional().nullable(),
  commercialLicenseNumber: z.string().trim().optional().nullable(),
  commercialLicenseExpiry: z.string().optional().nullable(),
  dotNumber: z.string().trim().optional().nullable(),
  pricingModel: z.string().optional().nullable(),
  baseHourlyRate: z.coerce.number().optional().nullable(),
  minimumBookingHours: z.coerce.number().optional().nullable(),
  cancellationPolicy: z.string().optional().nullable(),
  hasGpsTracking: z.boolean().optional().nullable(),
  hasBookingApi: z.boolean().optional().nullable(),
  apiEndpoint: z.string().trim().optional().nullable(),
  vehicles: z.array(z.any()).optional().default([]),
  debug: z.boolean().optional().default(false),
}).passthrough();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const debugId = crypto.randomUUID();
  let step = 'init';

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

    step = 'auth';
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ 
          error: 'authentication_failed', 
          details: 'Not authenticated',
          context: { step, debugId }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    step = 'parse_request';
    const rawData = await req.json();
    console.log(`[${debugId}] Processing application for user: ${user.id}`);

    step = 'validate_input';
    const validationResult = ApplicationSchema.safeParse(rawData);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: 'validation_failed', 
          details: validationResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', '),
          context: { step, debugId, userId: user.id }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const applicationData = validationResult.data;
    const supplierName = applicationData.businessName || 'Transportation Vendor';

    // Idempotent supplier creation: find or create
    step = 'find_supplier';
    let supplier;
    const { data: existingSuppliers } = await supabase
      .from('suppliers')
      .select('*')
      .eq('user_id', user.id)
      .eq('supplier_type', 'transportation')
      .limit(1);

    if (existingSuppliers && existingSuppliers.length > 0) {
      supplier = existingSuppliers[0];
      console.log(`[${debugId}] Reusing supplier: ${supplier.id}`);
    } else {
      step = 'create_supplier';
      const { data: newSupplier, error: supplierError } = await supabase
        .from('suppliers')
        .insert({
          user_id: user.id,
          supplier_type: 'transportation',
          name: supplierName,
          business_name: applicationData.businessName,
          contact_email: applicationData.contactEmail,
          contact_phone: applicationData.contactPhone || null,
          business_address: applicationData.businessAddress || null,
          description: applicationData.businessDescription || null,
          verification_status: 'pending',
        })
        .select()
        .single();

      if (supplierError) {
        console.error(`[${debugId}] Supplier insert failed:`, supplierError);
        return new Response(
          JSON.stringify({ 
            error: 'supplier_insert_failed', 
            details: supplierError.message,
            context: { 
              step, 
              debugId, 
              userId: user.id,
              code: supplierError.code,
              derivedName: supplierName
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      supplier = newSupplier;
      console.log(`[${debugId}] Supplier created: ${supplier.id}`);
    }

    // Create transportation vendor record
    step = 'create_vendor';
    const vendorData: any = {
      supplier_id: supplier.id,
      years_in_business: applicationData.yearsInBusiness || null,
      service_areas: applicationData.serviceAreas || [],
      total_drivers: applicationData.totalDrivers || null,
      insurance_policy_number: applicationData.insurancePolicyNumber || null,
      insurance_expiry_date: applicationData.insuranceExpiryDate || null,
      insurance_coverage_amount: applicationData.insuranceCoverageAmount || null,
      commercial_license_number: applicationData.commercialLicenseNumber || null,
      commercial_license_expiry: applicationData.commercialLicenseExpiry || null,
      dot_number: applicationData.dotNumber || null,
      pricing_model: applicationData.pricingModel || null,
      base_hourly_rate: applicationData.baseHourlyRate || null,
      minimum_booking_hours: applicationData.minimumBookingHours || null,
      cancellation_policy: applicationData.cancellationPolicy || null,
      has_gps_tracking: applicationData.hasGpsTracking || false,
      has_booking_api: applicationData.hasBookingApi || false,
      api_endpoint: applicationData.apiEndpoint || null,
    };

    // Add driver credentials
    if (rawData.driverVettingProcess) vendorData.driver_vetting_process = rawData.driverVettingProcess;
    if (rawData.backgroundCheckPolicy) vendorData.background_check_policy = rawData.backgroundCheckPolicy;
    if (rawData.averageDriverExperience) vendorData.average_driver_experience = rawData.averageDriverExperience;
    if (rawData.driverTrainingProgram) vendorData.driver_training_program = rawData.driverTrainingProgram;
    if (rawData.cdlCompliance !== undefined) vendorData.cdl_compliance = rawData.cdlCompliance;

    // Add technology integration
    if (rawData.hasRealTimeTracking !== undefined) vendorData.has_real_time_tracking = rawData.hasRealTimeTracking;
    if (rawData.hasMobileApp !== undefined) vendorData.has_mobile_app = rawData.hasMobileApp;
    if (rawData.hasAutomatedDispatch !== undefined) vendorData.has_automated_dispatch = rawData.hasAutomatedDispatch;

    // Add document uploads
    if (rawData.insuranceDocuments) vendorData.insurance_documents = rawData.insuranceDocuments;
    if (rawData.driverLicenseDocuments) vendorData.driver_license_documents = rawData.driverLicenseDocuments;

    // Add social media
    if (rawData.instagramHandle || rawData.tiktokHandle || rawData.twitterHandle || 
        rawData.facebookPage || rawData.linkedinPage) {
      vendorData.social_media = {
        instagram: rawData.instagramHandle || null,
        tiktok: rawData.tiktokHandle || null,
        twitter: rawData.twitterHandle || null,
        facebook: rawData.facebookPage || null,
        linkedin: rawData.linkedinPage || null,
      };
    }

    // Add promotion preferences
    if (rawData.selectedPromotionTier) {
      vendorData.promotion_preferences = {
        tier: rawData.selectedPromotionTier,
        budget: rawData.promotionBudget || null,
        pricing_model: rawData.promotionPricingModel || null,
        target_impressions: rawData.promotionTargetImpressions || null,
        target_clicks: rawData.promotionTargetClicks || null,
        geographic_targets: rawData.promotionGeographicTargets || [],
        discount_offered: rawData.promotionDiscountOffered || null,
        special_packages: rawData.promotionSpecialPackages || [],
        marketing_description: rawData.marketingDescription || null,
        promotional_media: rawData.promotionalMedia || [],
      };
    }

    const { data: transportVendor, error: vendorError } = await supabase
      .from('transportation_vendors')
      .insert(vendorData)
      .select()
      .single();

    if (vendorError) {
      console.error(`[${debugId}] Vendor insert failed:`, vendorError);
      return new Response(
        JSON.stringify({ 
          error: 'vendor_insert_failed', 
          details: vendorError.message,
          context: { step, debugId, userId: user.id, supplierId: supplier.id, code: vendorError.code }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log(`[${debugId}] Transport vendor created: ${transportVendor.id}`);

    // Create fleet records if vehicles provided
    step = 'create_fleet';
    if (applicationData.vehicles && applicationData.vehicles.length > 0) {
      try {
        const fleetRecords = applicationData.vehicles.map((vehicle: any) => ({
          vendor_id: transportVendor.id,
          vehicle_type: vehicle.vehicle_type || null,
          make: vehicle.make || null,
          model: vehicle.model || null,
          year: vehicle.year || null,
          passenger_capacity: vehicle.passenger_capacity || null,
          hourly_rate: vehicle.hourly_rate || null,
        }));

        const { error: fleetError } = await supabase
          .from('vendor_fleet')
          .insert(fleetRecords);

        if (fleetError) {
          console.error(`[${debugId}] Fleet insert warning:`, fleetError);
        } else {
          console.log(`[${debugId}] Fleet records created: ${fleetRecords.length}`);
        }
      } catch (fleetErr) {
        console.error(`[${debugId}] Fleet creation failed (non-critical):`, fleetErr);
      }
    }

    // Create vetting record (safe-guarded)
    step = 'create_vetting';
    try {
      const { error: vettingError } = await supabase
        .from('supplier_vetting')
        .insert({
          supplier_id: supplier.id,
          vetting_status: 'pending',
          documents_submitted: true,
          submitted_at: new Date().toISOString(),
        });

      if (vettingError) {
        console.error(`[${debugId}] Vetting insert warning:`, vettingError);
      }
    } catch (vettingErr) {
      console.error(`[${debugId}] Vetting creation failed (non-critical):`, vettingErr);
    }

    // Create notification for admins (safe-guarded)
    step = 'create_notifications';
    try {
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (adminRoles && adminRoles.length > 0) {
        const notifications = adminRoles.map((admin) => ({
          user_id: admin.user_id,
          type: 'system_announcement',
          title: 'New Transportation Vendor Application',
          message: `${applicationData.businessName} has submitted an application for review`,
          entity_type: 'supplier',
          entity_id: supplier.id,
          action_url: '/admin/transport-vendor-vetting',
        }));

        await supabase.from('notifications').insert(notifications);
      }
    } catch (notifErr) {
      console.error(`[${debugId}] Notification creation failed (non-critical):`, notifErr);
    }

    console.log(`[${debugId}] Application completed successfully`);
    return new Response(
      JSON.stringify({
        success: true,
        supplier_id: supplier.id,
        vendor_id: transportVendor.id,
        message: 'Application submitted successfully',
        ...(applicationData.debug ? { debugId } : {})
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error(`[${debugId}] Unhandled error at step '${step}':`, error);
    return new Response(
      JSON.stringify({ 
        error: 'internal_server_error',
        details: error.message,
        context: { step, debugId }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
