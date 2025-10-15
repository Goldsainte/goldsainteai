import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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

    const applicationData = await req.json();
    console.log('Processing transportation vendor application for user:', user.id);

    // Basic validation for required fields
    const businessName = (applicationData.businessName ?? '').toString().trim();
    const contactEmail = (applicationData.contactEmail ?? '').toString().trim();
    if (!businessName || !contactEmail) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: business name and contact email are required.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Create supplier record (ensure NOT NULL name)
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .insert({
        user_id: user.id,
        supplier_type: 'transportation',
        name: businessName || 'Transportation Vendor',
        business_name: businessName,
        contact_email: contactEmail,
        contact_phone: applicationData.contactPhone || null,
        business_address: applicationData.businessAddress || null,
        description: applicationData.businessDescription || null,
        verification_status: 'pending',
      })
      .select()
      .single();

    if (supplierError) {
      console.error('Error creating supplier:', supplierError);
      throw supplierError;
    }

    console.log('Supplier created:', supplier.id);

    // Create transportation vendor record
    const vendorData: any = {
      supplier_id: supplier.id,
      years_in_business: applicationData.yearsInBusiness,
      service_areas: applicationData.serviceAreas,
      total_drivers: applicationData.totalDrivers,
      insurance_policy_number: applicationData.insurancePolicyNumber,
      insurance_expiry_date: applicationData.insuranceExpiryDate,
      insurance_coverage_amount: applicationData.insuranceCoverageAmount,
      commercial_license_number: applicationData.commercialLicenseNumber,
      commercial_license_expiry: applicationData.commercialLicenseExpiry,
      dot_number: applicationData.dotNumber,
      pricing_model: applicationData.pricingModel,
      base_hourly_rate: applicationData.baseHourlyRate,
      minimum_booking_hours: applicationData.minimumBookingHours,
      cancellation_policy: applicationData.cancellationPolicy,
      has_gps_tracking: applicationData.hasGpsTracking,
      has_booking_api: applicationData.hasBookingApi,
      api_endpoint: applicationData.apiEndpoint,
    };

    // Add driver credentials
    if (applicationData.driverVettingProcess) vendorData.driver_vetting_process = applicationData.driverVettingProcess;
    if (applicationData.backgroundCheckPolicy) vendorData.background_check_policy = applicationData.backgroundCheckPolicy;
    if (applicationData.averageDriverExperience) vendorData.average_driver_experience = applicationData.averageDriverExperience;
    if (applicationData.driverTrainingProgram) vendorData.driver_training_program = applicationData.driverTrainingProgram;
    if (applicationData.cdlCompliance !== undefined) vendorData.cdl_compliance = applicationData.cdlCompliance;

    // Add technology integration
    if (applicationData.hasRealTimeTracking !== undefined) vendorData.has_real_time_tracking = applicationData.hasRealTimeTracking;
    if (applicationData.hasMobileApp !== undefined) vendorData.has_mobile_app = applicationData.hasMobileApp;
    if (applicationData.hasAutomatedDispatch !== undefined) vendorData.has_automated_dispatch = applicationData.hasAutomatedDispatch;

    // Add document uploads
    if (applicationData.insuranceDocuments) vendorData.insurance_documents = applicationData.insuranceDocuments;
    if (applicationData.driverLicenseDocuments) vendorData.driver_license_documents = applicationData.driverLicenseDocuments;

    // Add social media
    if (applicationData.instagramHandle || applicationData.tiktokHandle || applicationData.twitterHandle || 
        applicationData.facebookPage || applicationData.linkedinPage) {
      vendorData.social_media = {
        instagram: applicationData.instagramHandle || null,
        tiktok: applicationData.tiktokHandle || null,
        twitter: applicationData.twitterHandle || null,
        facebook: applicationData.facebookPage || null,
        linkedin: applicationData.linkedinPage || null,
      };
    }

    // Add promotion preferences
    if (applicationData.selectedPromotionTier) {
      vendorData.promotion_preferences = {
        tier: applicationData.selectedPromotionTier,
        budget: applicationData.promotionBudget || null,
        pricing_model: applicationData.promotionPricingModel || null,
        target_impressions: applicationData.promotionTargetImpressions || null,
        target_clicks: applicationData.promotionTargetClicks || null,
        geographic_targets: applicationData.promotionGeographicTargets || [],
        discount_offered: applicationData.promotionDiscountOffered || null,
        special_packages: applicationData.promotionSpecialPackages || [],
        marketing_description: applicationData.marketingDescription || null,
        promotional_media: applicationData.promotionalMedia || [],
      };
    }

    const { data: transportVendor, error: vendorError } = await supabase
      .from('transportation_vendors')
      .insert(vendorData)
      .select()
      .single();

    if (vendorError) {
      console.error('Error creating transport vendor:', vendorError);
      throw vendorError;
    }

    console.log('Transport vendor created:', transportVendor.id);

    // Create fleet records if vehicles provided
    if (applicationData.vehicles && applicationData.vehicles.length > 0) {
      const fleetRecords = applicationData.vehicles.map((vehicle: any) => ({
        vendor_id: transportVendor.id,
        vehicle_type: vehicle.vehicle_type,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        passenger_capacity: vehicle.passenger_capacity,
        hourly_rate: vehicle.hourly_rate,
      }));

      const { error: fleetError } = await supabase
        .from('vendor_fleet')
        .insert(fleetRecords);

      if (fleetError) {
        console.error('Error creating fleet records:', fleetError);
      } else {
        console.log('Fleet records created:', fleetRecords.length);
      }
    }

    // Create vetting record
    const { error: vettingError } = await supabase
      .from('supplier_vetting')
      .insert({
        supplier_id: supplier.id,
        vetting_status: 'pending',
        documents_submitted: true,
        submitted_at: new Date().toISOString(),
      });

    if (vettingError) {
      console.error('Error creating vetting record:', vettingError);
    }

    // Create notification for admins
    const { data: adminRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (adminRoles && adminRoles.length > 0) {
      const notifications = adminRoles.map((admin) => ({
        user_id: admin.user_id,
        notification_type: 'admin_alert',
        title: 'New Transportation Vendor Application',
        message: `${applicationData.businessName} has submitted an application for review`,
        metadata: {
          supplier_id: supplier.id,
          business_name: applicationData.businessName,
        },
        link: '/admin/transport-vendor-vetting',
      }));

      await supabase.from('notifications').insert(notifications);
    }

    return new Response(
      JSON.stringify({
        success: true,
        supplier_id: supplier.id,
        vendor_id: transportVendor.id,
        message: 'Application submitted successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error in submit-transportation-vendor-application:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
