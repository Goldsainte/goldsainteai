import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const { applicationId, applicationType, adminUserId } = await req.json();
    
    if (!applicationId || !applicationType) {
      throw new Error('Missing required fields: applicationId, applicationType');
    }

    if (!['agent', 'brand'].includes(applicationType)) {
      throw new Error('Invalid applicationType. Must be "agent" or "brand"');
    }

    console.log(`Processing ${applicationType} application approval:`, applicationId);

    // Get application details
    const tableName = applicationType === 'agent' ? 'agent_applications' : 'brand_applications';
    const { data: app, error: appError } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', applicationId)
      .single();

    if (appError || !app) {
      console.error('Application fetch error:', appError);
      throw new Error('Application not found');
    }

    // Check verification status
    if (app.stripe_verification_status !== 'verified') {
      throw new Error('Application must pass Stripe Identity verification first');
    }

    // Check if already approved
    if (app.admin_status === 'approved') {
      throw new Error('Application has already been approved');
    }

    // Generate temporary password
    const tempPassword = crypto.randomUUID().substring(0, 12);

    console.log(`Creating auth account for ${app.email}...`);

    // Create auth account
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: app.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: `${app.first_name} ${app.last_name}`,
        account_type: applicationType,
      }
    });

    if (authError) {
      console.error('Auth user creation error:', authError);
      throw new Error(`Failed to create auth account: ${authError.message}`);
    }

    const userId = authData.user.id;
    console.log(`Auth account created: ${userId}`);

    // Update application status
    const { error: updateError } = await supabase
      .from(tableName)
      .update({
        admin_status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminUserId,
        user_account_created: true,
        created_user_id: userId,
      })
      .eq('id', applicationId);

    if (updateError) {
      console.error('Application update error:', updateError);
      throw new Error(`Failed to update application: ${updateError.message}`);
    }

    // Create profile record
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: app.email,
        first_name: app.first_name,
        last_name: app.last_name,
        display_name: `${app.first_name} ${app.last_name}`,
        account_type: applicationType,
        is_profile_complete: true,
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Don't throw - profile might exist from trigger
    }

    // Create role-specific records
    if (applicationType === 'agent') {
      const { error: agentError } = await supabase
        .from('travel_agents')
        .insert({
          user_id: userId,
          agency_name: app.agency_name,
          email: app.email,
          phone: app.phone || '',
          business_type: app.business_type || '',
          license_number: app.license_number || '',
          years_experience: app.years_experience || 0,
          specialties: app.specialties || [],
          languages: app.languages || [],
          website: app.website || '',
          is_verified: true,
          identity_verified: true,
        });

      if (agentError) {
        console.error('Travel agent record creation error:', agentError);
        throw new Error(`Failed to create agent record: ${agentError.message}`);
      }

      console.log('Travel agent record created successfully');
    }

    if (applicationType === 'brand') {
      const { error: brandError } = await supabase
        .from('brand_profiles')
        .insert({
          owner_user_id: userId,
          brand_name: app.brand_name,
          brand_type: app.brand_type,
          contact_name: app.primary_contact_name,
          contact_email: app.primary_contact_email,
          contact_phone: app.primary_contact_phone,
          website: app.website || '',
          is_verified: true,
        });

      if (brandError) {
        console.error('Brand profile creation error:', brandError);
        throw new Error(`Failed to create brand profile: ${brandError.message}`);
      }

      console.log('Brand profile created successfully');
    }

    // Send welcome email with credentials (fire-and-forget)
    supabase.functions.invoke('notify-applicant-status-change', {
      body: {
        email: app.email,
        firstName: app.first_name,
        applicationType,
        status: 'approved',
        tempPassword,
      }
    }).catch(err => console.error('Email notification error:', err));

    console.log(`✅ Application ${applicationId} approved successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        message: 'Application approved and account created successfully',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error: any) {
    console.error('Approval function error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to approve application'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
