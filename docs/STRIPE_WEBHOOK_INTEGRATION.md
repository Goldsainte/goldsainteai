# Stripe Webhook Integration

## Overview

The `stripe-webhook` edge function handles all Stripe webhook events for the Goldsainte marketplace, including payments, subscriptions, payouts, disputes, and refunds.

## Supported Events

### Payment Processing
- `payment_intent.succeeded` - Full booking or milestone payments
- `payment_intent.payment_failed` - Payment failures and retry notifications

### Subscriptions
- `customer.subscription.created` - New subscription activation
- `customer.subscription.updated` - Subscription changes (upgrades, downgrades)
- `customer.subscription.deleted` - Subscription cancellation

### Stripe Connect Payouts
- `payout.paid` - Successful agent/creator payouts
- `payout.failed` - Payout failures requiring admin attention

### Disputes & Refunds
- `charge.dispute.created` - Payment dispute opened by traveler
- `charge.dispute.closed` - Dispute resolution
- `charge.refund.updated` - Refund processing

## Metadata Requirements

### Payment Intents
Every payment intent MUST include:

```typescript
metadata: {
  booking_id: "uuid",           // Required: booking reference
  milestone_id: "uuid",          // Optional: for milestone payments
  user_id: "uuid",               // Required: traveler ID
  booking_type: "full" | "milestone"  // Required: payment type
}
```

### Subscriptions
Every subscription MUST include:

```typescript
metadata: {
  user_id: "uuid",               // Required: user reference
  tier: "free" | "premium" | "enterprise"  // Required: subscription tier
}
```

## Database Updates

### Bookings Table
Payment events update the following fields:

```sql
-- Payment success
payment_status: 'pending' → 'captured'
status: 'pending' → 'confirmed'
stripe_payment_intent_id: payment_intent.id
paid_at: timestamp
payout_status: 'not_eligible' → 'pending'

-- Payment failure
payment_status: 'pending' → 'failed'

-- Refunds
refund_amount_cents: refund.amount
refunded_at: timestamp
payment_status: 'captured' → 'refunded' | 'partially_refunded'
status: 'confirmed' → 'cancelled' (if full refund)

-- Disputes
is_disputed: false → true
dispute_reason: dispute.reason
dispute_opened_at: timestamp
dispute_resolved_at: timestamp (when closed)
dispute_resolution: 'merchant_won' | 'customer_won'

-- Milestone payments
escrow_held_cents: accumulated milestone amounts
```

### Booking Milestones Table
Milestone payment events update:

```sql
status: 'pending' → 'funded'
stripe_payment_intent_id: payment_intent.id
funded_at: timestamp
```

### User Subscriptions Table
Subscription events update:

```sql
tier: 'free' | 'premium' | 'enterprise'
stripe_customer_id: customer.id
stripe_subscription_id: subscription.id
stripe_price_id: price.id
stripe_product_id: product.id
status: 'active' | 'past_due' | 'canceled'
cancel_at_period_end: boolean
current_period_start: timestamp
current_period_end: timestamp
ended_at: timestamp (when canceled)
```

### Webhook Events Table
Every webhook creates an idempotency record:

```sql
event_id: stripe_event.id (UNIQUE constraint)
event_type: stripe_event.type
event_source: 'stripe'
payload: stripe_event.data.object
processing_duration_ms: execution time
error_message: null | error details
processed_at: timestamp
```

## Notifications Created

### Payment Success
**Traveler:**
- Title: "Payment Confirmed"
- Message: "Your payment for {destination} has been confirmed."
- Priority: high

**Agent/Creator:**
- Title: "Payment Received"
- Message: "Payment confirmed for booking {booking_number}"
- Priority: high

### Payment Failure
**Traveler:**
- Title: "Payment Failed"
- Message: "Payment for booking {booking_number} failed. Please update your payment method."
- Priority: urgent
- Action: "Retry Payment"

### Milestone Funded
**Agent/Creator:**
- Title: "Milestone Funded"
- Message: "Milestone payment received: {milestone_title} - {amount}"
- Priority: high

### Subscription Updates
**User:**
- Active: "Your {tier} subscription is now active!"
- Canceled: "Your subscription has been canceled."
- Past Due: "Your subscription payment is past due." (urgent)

### Disputes
**Agent/Creator:**
- Created: "⚠️ Payment Dispute - A payment dispute has been opened for booking {booking_number}. Please provide evidence."
- Closed: "Dispute Resolved - Dispute for booking {booking_number} has been resolved. {result}"

### Refunds
**Traveler:**
- Title: "Refund Processed" | "Partial Refund Processed"
- Message: "A {full/partial} refund of {amount} has been processed for booking {booking_number}."
- Priority: high

## Security Features

### Signature Verification
All webhook requests verify Stripe signature using `STRIPE_WEBHOOK_SECRET`:

```typescript
const event = stripe.webhooks.constructEvent(
  rawBody,
  signature,
  STRIPE_WEBHOOK_SECRET
);
```

### Idempotency
Duplicate events are prevented via `webhook_events` table with UNIQUE constraint on `event_id`. If duplicate detected, returns 200 immediately without processing.

### Rate Limiting
100 requests per minute per IP address. Exceeded requests return 429 with `Retry-After` header.

## Environment Variables

Required configuration:

```bash
STRIPE_SECRET_KEY=sk_live_...           # Stripe API secret key
STRIPE_WEBHOOK_SECRET=whsec_...         # Webhook signing secret
SUPABASE_URL=https://xxx.supabase.co    # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY=eyJ...        # Service role key (bypasses RLS)
```

## Testing

### Local Testing with Stripe CLI

1. **Install Stripe CLI:**
```bash
brew install stripe/stripe-cli/stripe
stripe login
```

2. **Forward webhooks to local function:**
```bash
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
```

3. **Copy webhook signing secret** from CLI output and set as `STRIPE_WEBHOOK_SECRET`

4. **Trigger test events:**
```bash
# Payment success
stripe trigger payment_intent.succeeded

# Payment failure
stripe trigger payment_intent.payment_failed

# Subscription created
stripe trigger customer.subscription.created

# Subscription canceled
stripe trigger customer.subscription.deleted

# Dispute created
stripe trigger charge.dispute.created

# Refund
stripe trigger charge.refunded
```

5. **Test with metadata:**
```bash
stripe trigger payment_intent.succeeded \
  --add payment_intent:metadata.booking_id=123e4567-e89b-12d3-a456-426614174000 \
  --add payment_intent:metadata.user_id=123e4567-e89b-12d3-a456-426614174001 \
  --add payment_intent:metadata.booking_type=full
```

### Production Testing

1. **Enable test mode** in Stripe Dashboard
2. **Use test credit cards:**
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Dispute: `4000 0000 0000 0259`

3. **Monitor webhook logs:**
```bash
# View function logs
supabase functions logs stripe-webhook --tail

# Check webhook events table
SELECT * FROM webhook_events 
ORDER BY processed_at DESC 
LIMIT 10;
```

## Stripe Dashboard Configuration

### 1. Create Webhook Endpoint

Navigate to **Developers → Webhooks** and add endpoint:

```
https://iwdevxltjuedijrcdejs.supabase.co/functions/v1/stripe-webhook
```

### 2. Select Events

Enable the following events:

**Payments:**
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

**Subscriptions:**
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

**Payouts (Stripe Connect):**
- `payout.paid`
- `payout.failed`

**Disputes:**
- `charge.dispute.created`
- `charge.dispute.closed`

**Refunds:**
- `charge.refund.updated`

### 3. Copy Signing Secret

After creating the webhook, copy the **Signing secret** (starts with `whsec_`) and add to Supabase secrets as `STRIPE_WEBHOOK_SECRET`.

### 4. Test Endpoint

Click **Send test webhook** in Stripe Dashboard to verify endpoint is receiving events.

## Monitoring & Debugging

### View Webhook Logs

```sql
-- Recent webhook events
SELECT 
  event_id,
  event_type,
  processing_duration_ms,
  error_message,
  processed_at
FROM webhook_events
ORDER BY processed_at DESC
LIMIT 20;

-- Failed webhooks
SELECT *
FROM webhook_events
WHERE error_message IS NOT NULL
ORDER BY processed_at DESC;

-- Average processing time by event type
SELECT 
  event_type,
  COUNT(*) as total_events,
  AVG(processing_duration_ms) as avg_duration,
  MAX(processing_duration_ms) as max_duration
FROM webhook_events
GROUP BY event_type
ORDER BY avg_duration DESC;
```

### Check Stripe Dashboard

**Webhooks → [Your endpoint]**
- View delivery attempts
- See response codes
- Retry failed webhooks

### Common Issues

**❌ 400 Invalid signature**
- Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
- Check webhook endpoint URL is correct
- Ensure raw request body is used for signature verification

**❌ 429 Rate limit exceeded**
- Slow down webhook delivery in Stripe Dashboard
- Contact support to increase limits

**❌ 500 Internal error**
- Check function logs for detailed error
- Verify database schema matches code expectations
- Ensure `SUPABASE_SERVICE_ROLE_KEY` has proper permissions

**⚠️ Duplicate events processed**
- Verify `webhook_events` table has UNIQUE constraint on `event_id`
- Check idempotency logic is running before event processing

## TODO: Future Enhancements

### Stripe Connect Payout Tracking
Currently, payout events are logged but not fully integrated. Implement:

```typescript
// Track which bookings contribute to each payout
interface PayoutTracking {
  payout_id: string;
  booking_ids: string[];
  agent_id: string;
  total_amount_cents: number;
  status: 'pending' | 'paid' | 'failed';
}

// Update booking payout status when payout completes
async function handlePayoutPaid(payout: Stripe.Payout) {
  // Find all bookings in this payout batch
  // Update booking.payout_status to 'paid'
  // Create notifications for agents/creators
}
```

### Commission Distribution Logic
Implement automated commission splits:

```typescript
// Calculate platform fee, agent/creator split
interface CommissionSplit {
  platform_fee_cents: number;     // 15-20% of total
  agent_payout_cents: number;     // Remainder split
  creator_payout_cents: number;   // If co-curated
}

// Trigger Stripe Connect transfers on trip completion
```

### Email Receipt Integration
Send payment receipts via email service:

```typescript
// On payment_intent.succeeded
await sendPaymentReceipt({
  to: traveler.email,
  booking_number: booking.booking_number,
  amount: payment_intent.amount,
  receipt_url: payment_intent.charges.data[0].receipt_url
});
```

## Architecture Diagram

```
┌─────────────┐
│   Stripe    │
│  Dashboard  │
└──────┬──────┘
       │ Webhook Events
       ▼
┌──────────────────────────────────────┐
│  stripe-webhook Edge Function        │
│                                      │
│  1. Signature Verification           │
│  2. Rate Limiting (100/min)          │
│  3. Idempotency Check                │
│  4. Event Processing                 │
│  5. Database Updates                 │
│  6. Notification Creation            │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Supabase Database                   │
│                                      │
│  • bookings                          │
│  • booking_milestones                │
│  • user_subscriptions                │
│  • webhook_events (idempotency)      │
│  • notifications                     │
└──────────────────────────────────────┘
```

## Performance Considerations

- **Average processing time:** 150-300ms per event
- **Rate limit:** 100 requests/minute (sufficient for production scale)
- **Idempotency:** UNIQUE constraint prevents duplicate processing
- **Retry logic:** Stripe automatically retries failed webhooks up to 3 days
- **Timeout:** Function has 60s timeout (Supabase default)

## Security Best Practices

✅ **DO:**
- Always verify webhook signatures
- Use service role key for database writes
- Log all webhook events for audit trail
- Return 200 even for handled errors (prevents retries)
- Check idempotency before processing

❌ **DON'T:**
- Process webhooks without signature verification
- Store sensitive card data (Stripe handles this)
- Return 4xx/5xx for business logic errors
- Trust metadata without validation
- Skip idempotency checks

## Support

For issues with webhook processing:
1. Check function logs in Supabase dashboard
2. Verify webhook configuration in Stripe dashboard
3. Test locally with Stripe CLI
4. Review `webhook_events` table for error messages
5. Contact Stripe support for delivery issues
