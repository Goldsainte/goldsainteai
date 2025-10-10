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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { template_id } = await req.json();

    if (!template_id) {
      throw new Error('Template ID is required');
    }

    // Call the database function to process the purchase
    const { data, error } = await supabase.rpc('purchase_template_usage', {
      p_template_id: template_id,
      p_user_creator_id: user.id
    });

    if (error) throw error;

    // Create notification for original creator if coins were paid
    if (data.success && data.coins_paid > 0) {
      const { data: template } = await supabase
        .from('itinerary_templates')
        .select('creator_id, template_name')
        .eq('id', template_id)
        .single();

      if (template) {
        await supabase.from('notifications').insert({
          user_id: template.creator_id,
          notification_type: 'template_purchase',
          title: 'Template Purchased',
          message: `Someone purchased your template "${template.template_name}" for ${data.coins_paid} coins`,
          metadata: {
            template_id,
            buyer_id: user.id,
            coins_paid: data.coins_paid,
            transaction_id: data.transaction_id
          }
        });
      }
    }

    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Purchase template error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});