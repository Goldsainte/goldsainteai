import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "https://goldsainte.ai",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-EXPIRING] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

    // Get all active subscriptions expiring in the next 7 days
    const sevenDaysFromNow = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);
    const subscriptions = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
    });

    logStep("Found subscriptions", { count: subscriptions.data.length });

    let notificationsSent = 0;

    for (const subscription of subscriptions.data) {
      const daysUntilExpiry = Math.floor((subscription.current_period_end - Date.now() / 1000) / (24 * 60 * 60));
      
      // Only notify for subscriptions expiring in exactly 7 days
      if (daysUntilExpiry === 7) {
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        
        if ('email' in customer && customer.email) {
          const productId = subscription.items.data[0].price.product as string;
          const { data: subData } = await supabaseClient
            .from('user_subscriptions')
            .select('tier')
            .eq('user_id', (subscription.metadata?.user_id || ''))
            .single();

          // Send expiring notification email
          const emailResponse = await supabaseClient.functions.invoke('send-subscription-email', {
            body: {
              email: customer.email,
              type: 'expiring',
              newTier: subData?.tier || 'premium',
              expirationDate: new Date(subscription.current_period_end * 1000).toISOString(),
            },
          });

          if (emailResponse.error) {
            logStep("Error sending email", { error: emailResponse.error });
          } else {
            notificationsSent++;
            logStep("Expiring notification sent", { 
              email: customer.email,
              expirationDate: new Date(subscription.current_period_end * 1000).toISOString()
            });
          }
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      notificationsSent,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
