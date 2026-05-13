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

    // Check if user is admin
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roles) {
      throw new Error('Unauthorized: Admin access required');
    }

    const { supplierId, approved, notes } = await req.json();
    console.log('Processing vendor approval:', { supplierId, approved });

    // Get supplier details
    const { data: supplier, error: supplierFetchError } = await supabase
      .from('suppliers')
      .select('*, transportation_vendors(*)')
      .eq('id', supplierId)
      .single();

    if (supplierFetchError || !supplier) {
      throw new Error('Supplier not found');
    }

    if (approved) {
      // Update supplier verification status
      const { error: updateError } = await supabase
        .from('suppliers')
        .update({
          verification_status: 'verified',
          is_verified: true,
        })
        .eq('id', supplierId);

      if (updateError) {
        console.error('Error updating supplier:', updateError);
        throw updateError;
      }

      // Update vetting record
      const { error: vettingError } = await supabase
        .from('supplier_vetting')
        .update({
          vetting_status: 'approved',
          approval_decision: 'approved',
          vetting_notes: notes || 'Application approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq('supplier_id', supplierId);

      if (vettingError) {
        console.error('Error updating vetting:', vettingError);
      }

      // Notify vendor of approval
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: supplier.user_id,
          type: 'system_announcement',
          title: 'Application Approved!',
          message: 'Your transportation vendor application has been approved. You can now access your vendor dashboard.',
          action_url: '/transportation-vendor-dashboard',
        });

      if (notificationError) {
        console.error('Error creating notification:', notificationError);
      }

      console.log('Vendor approved successfully:', supplierId);
    } else {
      // Update vetting record with rejection
      const { error: vettingError } = await supabase
        .from('supplier_vetting')
        .update({
          vetting_status: 'rejected',
          approval_decision: 'rejected',
          vetting_notes: notes || 'Application rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq('supplier_id', supplierId);

      if (vettingError) {
        console.error('Error updating vetting:', vettingError);
      }

      // Notify vendor of rejection
      await supabase
        .from('notifications')
        .insert({
          user_id: supplier.user_id,
          type: 'system_announcement',
          title: 'Application Status Update',
          message: `Your transportation vendor application requires additional information. ${notes || ''}`,
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: approved ? 'Vendor approved successfully' : 'Application rejected',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error in approve-transportation-vendor:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
