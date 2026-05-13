import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { sessionId } = await req.json();

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: "2024-06-20",
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      const metadata = session.metadata;

      // Create payment record
      const escrowReleaseDate = new Date();
      escrowReleaseDate.setDate(escrowReleaseDate.getDate() + 3); // 3 days after completion

      const { data: payment, error } = await supabaseAdmin
        .from('transportation_payments')
        .insert({
          booking_id: metadata.booking_id,
          vendor_id: metadata.vendor_id,
          customer_id: metadata.customer_id,
          total_amount: parseFloat(metadata.platform_fee) + parseFloat(metadata.vendor_payout),
          platform_fee: parseFloat(metadata.platform_fee),
          vendor_payout: parseFloat(metadata.vendor_payout),
          payment_status: 'held_in_escrow',
          stripe_payment_intent_id: session.payment_intent,
          escrow_release_date: escrowReleaseDate.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Update booking status
      await supabaseAdmin
        .from('transportation_bookings')
        .update({ booking_status: 'confirmed' })
        .eq('id', metadata.booking_id);

      // Update vendor escrow account
      await supabaseAdmin
        .from('vendor_escrow_accounts')
        .upsert({
          vendor_id: metadata.vendor_id,
          pending_amount: parseFloat(metadata.vendor_payout),
        }, { onConflict: 'vendor_id' });

      return new Response(JSON.stringify({ success: true, payment }), {
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ success: false }), {
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      status: 400,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});