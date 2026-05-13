import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://goldsainte.ai',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user?.email) {
      throw new Error('User not authenticated');
    }

    const { jobId, travelers, paymentMode } = await req.json();
    
    console.log('Creating group payment links:', { jobId, travelers: travelers.length, paymentMode });

    // Verify user owns this job
    const { data: job, error: jobError } = await supabaseClient
      .from('marketplace_jobs')
      .select('*, agent_bids!winning_bid_id(*)')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      throw new Error('Job not found');
    }

    if (job.user_id !== user.id) {
      throw new Error('Unauthorized - not job owner');
    }

    // Get the winning bid to calculate amounts
    const { data: bid } = await supabaseClient
      .from('agent_bids')
      .select('*')
      .eq('id', job.winning_bid_id)
      .single();

    if (!bid) {
      throw new Error('No winning bid found');
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: "2024-06-20",
    });

    const totalAmount = bid.customer_facing_price;
    const currency = bid.currency.toLowerCase();
    const travelerCount = travelers.length;

    // Calculate amount per traveler (equal split)
    const amountPerTraveler = paymentMode === 'split_equal' 
      ? totalAmount / travelerCount 
      : totalAmount; // single_payer pays full amount

    // Create traveler records and payment links
    const travelerRecords = [];
    
    for (let i = 0; i < travelers.length; i++) {
      const traveler = travelers[i];
      const amount = paymentMode === 'split_equal' ? amountPerTraveler : (i === 0 ? totalAmount : 0);
      
      if (amount === 0) continue; // Skip travelers with no payment in single_payer mode

      // Create Stripe Payment Link
      const paymentLink = await stripe.paymentLinks.create({
        line_items: [
          {
            price_data: {
              currency,
              product_data: {
                name: `${job.title} - Traveler ${i + 1}`,
                description: `Payment for ${traveler.name} (${traveler.email})`
              },
              unit_amount: Math.round(amount * 100) // Convert to cents
            },
            quantity: 1
          }
        ],
        after_completion: {
          type: 'redirect',
          redirect: {
            url: `${req.headers.get('origin')}/payment-success?jobId=${jobId}&travelerId=${i + 1}`
          }
        },
        metadata: {
          job_id: jobId,
          traveler_number: (i + 1).toString(),
          traveler_email: traveler.email,
          payment_type: 'group_booking'
        }
      });

      // Insert traveler record
      const { data: travelerRecord, error: insertError } = await supabaseClient
        .from('group_booking_travelers')
        .insert({
          job_id: jobId,
          traveler_email: traveler.email,
          traveler_name: traveler.name,
          traveler_number: i + 1,
          amount_owed: amount,
          currency: currency.toUpperCase(),
          stripe_payment_link: paymentLink.url
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting traveler:', insertError);
        throw insertError;
      }

      travelerRecords.push({
        ...travelerRecord,
        paymentLink: paymentLink.url
      });

      // Send email notification to traveler
      try {
        await supabaseClient.functions.invoke('send-notification', {
          body: {
            to: traveler.email,
            subject: `Payment Required: ${job.title}`,
            html: `
              <h2>You're invited to join a group booking!</h2>
              <p>Hi ${traveler.name},</p>
              <p>${user.email} has organized a group booking for: <strong>${job.title}</strong></p>
              <p><strong>Your payment amount: ${currency.toUpperCase()} ${amount.toFixed(2)}</strong></p>
              <p>To confirm your spot in this booking, please complete your payment:</p>
              <a href="${paymentLink.url}" style="display: inline-block; padding: 12px 24px; background: #0066cc; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
                Pay Now
              </a>
              <p><small>Important: The booking will only be confirmed once all travelers have completed their payments.</small></p>
            `
          }
        });
      } catch (emailError) {
        console.error('Error sending email to traveler:', emailError);
        // Don't fail the whole process if email fails
      }
    }

    // Update job with group payment info
    await supabaseClient
      .from('marketplace_jobs')
      .update({
        is_group_booking: true,
        group_payment_mode: paymentMode,
        group_organizer_email: user.email,
        total_travelers: paymentMode === 'split_equal' ? travelerCount : 1,
        payment_status: 'pending'
      })
      .eq('id', jobId);

    console.log('Successfully created group payment links:', travelerRecords.length);

    return new Response(
      JSON.stringify({ 
        success: true,
        travelers: travelerRecords,
        message: 'Payment links created and emails sent'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('Error creating group payment links:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to create payment links' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
