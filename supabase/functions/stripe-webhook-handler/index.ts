import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { checkAndRecordWebhook, updateWebhookStatus } from "../_shared/webhookIdempotency.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2024-06-20",
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");

  if (!signature || !webhookSecret) {
    console.error("Missing stripe-signature header or webhook secret");
    return new Response("Webhook signature or secret missing", { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    
    console.log(`Processing webhook event: ${event.type}`);

    // Check idempotency
    const { shouldProcess, isNew } = await checkAndRecordWebhook(
      supabaseClient,
      event.id,
      event.type,
      event.data.object as Record<string, any>
    );

    if (!shouldProcess) {
      console.log(`Event ${event.id} already processed, skipping`);
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    try {
      switch (event.type) {
        case "checkout.session.completed":
          await handleCheckoutCompleted(event.data.object);
          break;
        
        case "payment_intent.succeeded":
          await handlePaymentSucceeded(event.data.object);
          break;
        
        case "payment_intent.payment_failed":
          await handlePaymentFailed(event.data.object);
          break;
        
        case "charge.refunded":
          await handleChargeRefunded(event.data.object);
          break;
        
        case "transfer.created":
          await handleTransferCreated(event.data.object);
          break;
        
        case "payout.paid":
          await handlePayoutPaid(event.data.object);
          break;
        
        case "account.updated":
          await handleAccountUpdated(event.data.object);
          break;
        
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      await updateWebhookStatus(supabaseClient, event.id, 'success');
    } catch (handlerError: unknown) {
      console.error('Handler error:', handlerError);
      const errorMessage = handlerError instanceof Error ? handlerError.message : 'Unknown error occurred';
      await updateWebhookStatus(supabaseClient, event.id, 'failed', errorMessage);
      throw handlerError;
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Webhook error:", error.message);
    return new Response(`Webhook Error: ${error.message}`, { status: 400 });
  }
});

async function handleCheckoutCompleted(session: any) {
  console.log("Processing checkout.session.completed", session.id);
  
  const metadata = session.metadata || {};
  
  // Handle different checkout types based on metadata
  if (metadata.type === 'trip_booking' && metadata.trip_booking_id) {
    await supabaseClient
      .from('trip_bookings')
      .update({ status: 'confirmed', updated_at: new Date().toISOString() })
      .eq('id', metadata.trip_booking_id);

    await notifyAndEmailOnBookingConfirmed(metadata.trip_booking_id, session);
    return;
  } else if (metadata.type === 'package_booking') {
    await supabaseClient.from('package_bookings').insert({
      package_id: metadata.package_id,
      customer_id: metadata.customer_id,
      stripe_payment_intent_id: session.payment_intent,
      total_price: session.amount_total / 100,
      currency: session.currency,
      status: 'confirmed',
    });
  } else if (metadata.type === 'group_payment') {
    await supabaseClient
      .from('group_participants')
      .update({ payment_status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', metadata.participant_id);
  } else if (metadata.type === 'coin_purchase') {
    const coins = parseInt(metadata.coins || '0');
    await supabaseClient.rpc('award_loyalty_points', {
      target_user_id: metadata.user_id,
      points: coins,
      transaction_reason: 'coin_purchase',
    });
  } else if (metadata.type === 'booking' && metadata.booking_id) {
    // Handle new booking payment system
    await handleBookingPayment(metadata.booking_id, session);
  } else if (metadata.type === 'itinerary_purchase' && metadata.product_id && metadata.buyer_id) {
    const { error } = await supabaseClient.from('itinerary_purchases').insert({
      buyer_id: metadata.buyer_id,
      product_id: metadata.product_id,
      stripe_payment_intent_id: session.payment_intent,
      amount_paid: (session.amount_total ?? 0) / 100,
      currency: (session.currency || 'usd').toUpperCase(),
    });
    if (error && !error.message?.includes('duplicate')) {
      console.error('Failed to record itinerary purchase', error);
    }

    // Credit affiliate referrer (10% of platform commission, where platform = 7%)
    await creditAffiliateCommission({
      affiliateCode: metadata.affiliate_code,
      grossAmount: (session.amount_total ?? 0) / 100,
      currency: (session.currency || 'usd').toUpperCase(),
    });

    // Increment creator lifetime sales for tier progression
    try {
      const { data: prod } = await supabaseClient
        .from('itinerary_products')
        .select('creator_id')
        .eq('id', metadata.product_id)
        .single();
      if (prod?.creator_id) {
        await supabaseClient.rpc('increment_lifetime_sales', {
          _user_id: prod.creator_id,
          _delta: 1,
        });
      }
    } catch (tierErr) {
      console.error('Failed to increment creator lifetime sales', tierErr);
    }

    // Send branded "Your guide is ready" email
    try {
      const { data: buyerProfile } = await supabaseClient
        .from('profiles')
        .select('email, full_name')
        .eq('id', metadata.buyer_id)
        .single();

      const { data: guideData } = await supabaseClient
        .from('itinerary_products')
        .select('title, destination, duration_days')
        .eq('id', metadata.product_id)
        .single();

      const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
      if (RESEND_API_KEY && buyerProfile?.email && guideData) {
        const firstName = buyerProfile.full_name?.split(' ')[0] || 'there';
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Goldsainte <noreply@goldsainte.ai>',
            to: buyerProfile.email,
            subject: `Your itinerary guide is ready — ${guideData.title}`,
            html: `
              <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #f7f3ea; color: #0a2225;">
                <p style="font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #C7A962; margin: 0 0 24px;">Goldsainte</p>
                <h1 style="font-family: Georgia, serif; font-size: 28px; line-height: 1.2; margin: 0 0 16px; color: #0a2225;">Your guide is ready</h1>
                <p style="font-size: 15px; line-height: 1.6; margin: 0 0 12px;">Hi ${firstName},</p>
                <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px;">You now have full access to <em>${guideData.title}</em> — a ${guideData.duration_days}-day itinerary for ${guideData.destination}.</p>
                <a href="https://goldsainte.ai/my-purchases" style="display: inline-block; background: #0c4d47; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 999px; font-family: Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 500;">View My Guides</a>
                <p style="font-size: 13px; color: #6B7280; margin: 32px 0 0; line-height: 1.6;">You can access this guide anytime from your My Purchases page.</p>
                <hr style="border: none; border-top: 1px solid #E5DFC6; margin: 32px 0 16px;" />
                <p style="font-size: 11px; color: #9A9384; margin: 0;">© 2026 Goldsainte. The smarter travel marketplace.</p>
              </div>
            `,
          }),
        });
      }
    } catch (emailErr) {
      console.error('Failed to send guide-ready email', emailErr);
    }

    return;
  }

  if (metadata.type === 'bundle_purchase' && metadata.bundle_id && metadata.buyer_id) {
    await handleBundlePurchase(metadata, session);
    return;
  }
}

async function handleBundlePurchase(metadata: any, session: any) {
  console.log("Processing bundle_purchase", metadata.bundle_id);
  const { data: bundle, error: bErr } = await supabaseClient
    .from('product_bundles')
    .select('id, creator_id, currency, trip_id, guide_ids, title')
    .eq('id', metadata.bundle_id)
    .single();
  if (bErr || !bundle) {
    console.error('Bundle not found', bErr);
    return;
  }

  const amountPaid = (session.amount_total ?? 0) / 100;
  const currency = (session.currency || bundle.currency || 'usd').toUpperCase();

  // Idempotency-friendly insert (stripe_payment_intent_id is UNIQUE)
  const { data: existing } = await supabaseClient
    .from('bundle_purchases')
    .select('id, trip_booking_id')
    .eq('stripe_payment_intent_id', session.payment_intent)
    .maybeSingle();
  if (existing) {
    console.log('Bundle purchase already recorded', existing.id);
    return;
  }

  // Tier-based commission split. TIER_COMMISSION values are platform percentages
  // (bronze 15, silver 12, gold 10, platinum 8). Default to bronze when unknown.
  const commissionPct = await getCreatorCommissionPct(bundle.creator_id);
  const platformCommission = Math.round(amountPaid * commissionPct * 100) / 100;
  const partnerPayout = Math.round((amountPaid - platformCommission) * 100) / 100;

  // 1. Create trip booking for bundled trip (if any)
  let tripBookingId: string | null = null;
  if (bundle.trip_id) {
    const { data: booking, error: bookErr } = await supabaseClient
      .from('trip_bookings')
      .insert({
        traveler_id: metadata.buyer_id,
        partner_id: bundle.creator_id,
        partner_role: 'creator',
        total_price: amountPaid,
        currency,
        status: 'confirmed',
        partner_payout: partnerPayout,
        platform_commission: platformCommission,
        stripe_payment_intent_id: session.payment_intent,
        metadata: {
          source: 'bundle_purchase',
          bundle_id: bundle.id,
          trip_id: bundle.trip_id,
          commission_pct: commissionPct,
        },
      } as any)
      .select('id')
      .single();
    if (bookErr) {
      console.error('Failed to create trip_booking for bundle', bookErr);
    } else {
      tripBookingId = booking?.id ?? null;
    }
  }

  // 2. Create itinerary_purchases for each guide
  const guideIds: string[] = Array.isArray(bundle.guide_ids) ? bundle.guide_ids : [];
  for (const productId of guideIds) {
    const { error: ipErr } = await supabaseClient.from('itinerary_purchases').insert({
      buyer_id: metadata.buyer_id,
      product_id: productId,
      stripe_payment_intent_id: `${session.payment_intent}:${productId}`,
      amount_paid: 0,
      currency,
    });
    if (ipErr && !ipErr.message?.includes('duplicate')) {
      console.error('Failed to record bundled guide purchase', productId, ipErr);
    }
  }

  // 3. Record bundle purchase
  await supabaseClient.from('bundle_purchases').insert({
    bundle_id: bundle.id,
    buyer_id: metadata.buyer_id,
    stripe_payment_intent_id: session.payment_intent,
    amount_paid: amountPaid,
    currency,
    trip_booking_id: tripBookingId,
    partner_payout: partnerPayout,
    platform_commission: platformCommission,
  });

  // 4. Affiliate commission
  await creditAffiliateCommission({
    affiliateCode: metadata.affiliate_code,
    grossAmount: amountPaid,
    currency,
  });

  // 5. Lifetime sales increment for tier
  try {
    await supabaseClient.rpc('increment_lifetime_sales', {
      _user_id: bundle.creator_id,
      _delta: 1,
    });
  } catch (e) {
    console.error('increment_lifetime_sales bundle err', e);
  }
}

const TIER_COMMISSION_PCT: Record<string, number> = {
  bronze: 0.15,
  silver: 0.12,
  gold: 0.10,
  platinum: 0.08,
};

async function getCreatorCommissionPct(creatorId: string): Promise<number> {
  try {
    const { data } = await supabaseClient
      .from('profiles')
      .select('creator_tier')
      .eq('id', creatorId)
      .maybeSingle();
    const tier = (data?.creator_tier as string | undefined)?.toLowerCase() ?? 'bronze';
    return TIER_COMMISSION_PCT[tier] ?? TIER_COMMISSION_PCT.bronze;
  } catch (e) {
    console.error('getCreatorCommissionPct error, defaulting to bronze', e);
    return TIER_COMMISSION_PCT.bronze;
  }
}

async function handleBookingPayment(bookingId: string, session: any) {
  console.log("Processing booking payment", bookingId);
  
  // Get booking details
  const { data: booking, error: bookingError } = await supabaseClient
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .maybeSingle();
  
  if (bookingError || !booking) {
    console.error('Booking not found:', bookingError);
    return;
  }
  
  // Update booking status
  await supabaseClient
    .from('bookings')
    .update({ status: 'paid' })
    .eq('id', bookingId);
  
  // Check if ledger entries already exist
  const { data: existing } = await supabaseClient
    .from('earnings_ledger')
    .select('id')
    .eq('booking_id', bookingId)
    .limit(1);
  
  if (existing && existing.length > 0) {
    console.log('Ledger entries already exist for booking', bookingId);
    return;
  }
  
  // Create earnings ledger entries
  const rows: any[] = [];
  
  if (booking.agent_id && booking.agent_share) {
    rows.push({
      booking_id: booking.id,
      user_id: booking.agent_id,
      role: 'agent',
      amount: booking.agent_share,
      currency: booking.currency || 'USD',
      status: 'pending', // Will be moved to 'available' after trip completes
    });
  }
  
  if (booking.creator_id && booking.creator_share) {
    rows.push({
      booking_id: booking.id,
      user_id: booking.creator_id,
      role: 'creator',
      amount: booking.creator_share,
      currency: booking.currency || 'USD',
      status: 'pending',
    });
  }
  
  if (rows.length > 0) {
    const { error: ledgerError } = await supabaseClient
      .from('earnings_ledger')
      .insert(rows);
    
    if (ledgerError) {
      console.error('Error creating earnings ledger:', ledgerError);
    } else {
      console.log('Created earnings ledger entries for booking', bookingId);
    }
  }
}

async function handlePaymentSucceeded(paymentIntent: any) {
  console.log("Processing payment_intent.succeeded", paymentIntent.id);
  
  // Update payment records
  await supabaseClient
    .from('activity_logs')
    .insert({
      user_id: paymentIntent.metadata?.user_id,
      action: 'payment_succeeded',
      entity_type: 'payment',
      entity_id: paymentIntent.id,
      details: { amount: paymentIntent.amount, currency: paymentIntent.currency },
    });
}

async function handlePaymentFailed(paymentIntent: any) {
  console.log("Processing payment_intent.payment_failed", paymentIntent.id);
  
  await supabaseClient
    .from('activity_logs')
    .insert({
      user_id: paymentIntent.metadata?.user_id,
      action: 'payment_failed',
      entity_type: 'payment',
      entity_id: paymentIntent.id,
      details: { 
        amount: paymentIntent.amount, 
        currency: paymentIntent.currency,
        failure_message: paymentIntent.last_payment_error?.message 
      },
    });
}

async function handleChargeRefunded(charge: any) {
  console.log("Processing charge.refunded", charge.id);
  
  // Log refund
  await supabaseClient.from('activity_logs').insert({
    action: 'charge_refunded',
    entity_type: 'charge',
    entity_id: charge.id,
    details: { amount_refunded: charge.amount_refunded, currency: charge.currency },
  });
}

async function handleTransferCreated(transfer: any) {
  console.log("Processing transfer.created", transfer.id);
  
  // Update creator balance if applicable
  if (transfer.metadata?.creator_id) {
    await supabaseClient
      .from('creator_balances')
      .update({ 
        pending_balance: supabaseClient.rpc('increment', { x: transfer.amount / 100 }),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', transfer.metadata.creator_id);
  }
}

async function handlePayoutPaid(payout: any) {
  console.log("Processing payout.paid", payout.id);
  
  // Update creator balance - move from pending to paid
  if (payout.metadata?.creator_id) {
    const amount = payout.amount / 100;
    await supabaseClient
      .from('creator_balances')
      .update({ 
        available_balance: supabaseClient.rpc('increment', { x: amount }),
        pending_balance: supabaseClient.rpc('decrement', { x: amount }),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', payout.metadata.creator_id);
  }
}

async function handleAccountUpdated(account: any) {
  console.log("Processing account.updated", account.id);
  
  const metadata = account.metadata || {};
  const applicationId = metadata.goldsainte_application_id;
  const accountType = metadata.goldsainte_type;

  // Handle agent application Stripe Connect updates
  if (applicationId && accountType === 'agent') {
    await supabaseClient
      .from('agent_applications')
      .update({
        stripe_connect_onboarding_complete: account.details_submitted || false,
        stripe_connect_charges_enabled: account.charges_enabled || false,
        stripe_connect_payouts_enabled: account.payouts_enabled || false,
        stripe_connect_last_updated: new Date().toISOString(),
      })
      .eq('stripe_connect_account_id', account.id);

    // If onboarding complete, also update profiles table
    if (account.details_submitted && account.payouts_enabled) {
      const { data: application } = await supabaseClient
        .from('agent_applications')
        .select('created_user_id')
        .eq('stripe_connect_account_id', account.id)
        .single();

      if (application?.created_user_id) {
        await supabaseClient
          .from('profiles')
          .update({
            stripe_connect_account_id: account.id,
            stripe_connect_payouts_enabled: true,
          })
          .eq('id', application.created_user_id);
      }
    }
  }
  
  // Handle existing Stripe Connect status updates (for authenticated users)
  await supabaseClient
    .from('profiles')
    .update({ 
      stripe_account_id: account.id,
      stripe_onboarding_complete: account.details_submitted,
    })
    .eq('stripe_account_id', account.id);
}

async function notifyAndEmailOnBookingConfirmed(tripBookingId: string, session: any) {
  try {
    const { data: bookingData } = await supabaseClient
      .from('trip_bookings')
      .select('partner_id, traveler_id, total_price, currency')
      .eq('id', tripBookingId)
      .single();

    if (!bookingData) return;

    // Increment partner (creator/agent) lifetime sales for tier progression
    if (bookingData.partner_id) {
      try {
        await supabaseClient.rpc('increment_lifetime_sales', {
          _user_id: bookingData.partner_id,
          _delta: 1,
        });
      } catch (tierErr) {
        console.error('Failed to increment partner lifetime sales', tierErr);
      }
    }

    // Credit affiliate referrer if present in session metadata
    await creditAffiliateCommission({
      affiliateCode: session?.metadata?.affiliate_code,
      grossAmount: (session?.amount_total ?? 0) / 100,
      currency: (session?.currency || bookingData.currency || 'usd').toUpperCase(),
    });

    // 1. Partner notification
    if (bookingData.partner_id) {
      await supabaseClient.from('notifications').insert({
        user_id: bookingData.partner_id,
        type: 'booking_confirmed',
        title: 'New booking confirmed',
        message: 'A traveler has paid the deposit for your trip. Check your bookings dashboard.',
        entity_type: 'trip_booking',
        entity_id: tripBookingId,
        action_url: '/partner-bookings',
        action_label: 'View booking',
      });
    }

    // 2. Traveler confirmation email (inline via Resend to keep dependency-free)
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.log('RESEND_API_KEY not configured, skipping booking confirmation email');
      return;
    }

    // Look up traveler email via auth admin
    const { data: travelerUser } = await supabaseClient.auth.admin.getUserById(
      bookingData.traveler_id
    );
    const travelerEmail = travelerUser?.user?.email;
    if (!travelerEmail) {
      console.log('No email for traveler', bookingData.traveler_id);
      return;
    }

    const amountFmt = ((session.amount_total ?? 0) / 100).toFixed(2);
    const currency = (session.currency || bookingData.currency || 'usd').toUpperCase();

    const html = `
      <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;background:#f7f3ea;color:#0a2225;padding:32px;">
        <h1 style="font-size:24px;margin:0 0 16px 0;">Your Goldsainte booking is confirmed</h1>
        <p>Thank you — your deposit of <strong>${currency} ${amountFmt}</strong> has been received.</p>
        <p>Booking reference: <code>${tripBookingId}</code></p>
        <p>Your specialist will be in touch shortly to finalise your trip details.</p>
        <p style="margin-top:32px;font-size:12px;color:#7A7151;">© ${new Date().getFullYear()} Goldsainte</p>
      </div>
    `;

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'Goldsainte <hello@goldsainte.ai>',
        to: [travelerEmail],
        subject: 'Your Goldsainte booking is confirmed',
        html,
      }),
    });
    if (!resp.ok) {
      console.error('Booking confirmation email failed', await resp.text());
    }
  } catch (e) {
    console.error('notifyAndEmailOnBookingConfirmed error', e);
  }
}

/**
 * Credits an affiliate referrer 10% of the platform commission (platform = 7% of gross).
 * Idempotency: relies on at-most-once webhook dispatch per session.
 */
async function creditAffiliateCommission(args: {
  affiliateCode?: string | null;
  grossAmount: number;
  currency: string;
}) {
  try {
    if (!args.affiliateCode || args.grossAmount <= 0) return;
    const { data: link } = await supabaseClient
      .from('affiliate_links')
      .select('id, creator_id, conversions, total_earnings, commission_rate')
      .eq('affiliate_code', args.affiliateCode)
      .eq('is_active', true)
      .maybeSingle();
    if (!link) return;

    const PLATFORM_FEE_RATE = 0.07;
    const referrerShare = (Number(link.commission_rate) || 10) / 100; // default 10%
    const platformCommission = args.grossAmount * PLATFORM_FEE_RATE;
    const commissionAmount = Number((platformCommission * referrerShare).toFixed(2));
    if (commissionAmount <= 0) return;

    await supabaseClient.from('affiliate_commissions').insert({
      affiliate_link_id: link.id,
      creator_id: link.creator_id,
      commission_amount: commissionAmount,
      currency: args.currency,
      status: 'pending',
    });

    await supabaseClient
      .from('affiliate_links')
      .update({
        conversions: (link.conversions ?? 0) + 1,
        total_earnings: Number(link.total_earnings ?? 0) + commissionAmount,
      })
      .eq('id', link.id);
  } catch (e) {
    console.error('creditAffiliateCommission error', e);
  }
}
