import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://goldsainte.ai',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();
    
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!stripeSecretKey || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      throw new Error('Payment not completed');
    }

    const metadata = session.metadata;
    if (!metadata || metadata.type !== 'post_promotion') {
      throw new Error('Invalid session metadata');
    }

    const { post_id, plan_id, duration_days } = metadata;
    const durationDays = parseInt(duration_days);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token || '');

    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    // Calculate expiry date
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    // Get reach estimate based on plan
    const reachEstimates: Record<string, string> = {
      basic: '5K-10K',
      standard: '15K-25K',
      premium: '50K-100K'
    };

    // Create promoted post record
    const { data: promotedPost, error: insertError } = await supabase
      .from('promoted_posts')
      .insert({
        post_id,
        user_id: user.id,
        plan_id,
        amount: session.amount_total ? session.amount_total / 100 : 0,
        currency: session.currency || 'usd',
        duration_days: durationDays,
        expires_at: expiresAt.toISOString(),
        reach_estimate: reachEstimates[plan_id] || 'Unknown',
        status: 'active',
        stripe_payment_intent_id: session.payment_intent as string
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating promoted post:', insertError);
      throw insertError;
    }

    console.log('Promotion activated:', promotedPost);

    return new Response(
      JSON.stringify({ success: true, promotion: promotedPost }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error verifying promotion payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
