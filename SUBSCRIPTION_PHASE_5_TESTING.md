# Phase 5: Production Testing & Validation Plan

## Overview
Comprehensive testing plan for subscription system before production launch, covering end-to-end flows, Stripe webhooks, customer portal, performance, and monitoring.

---

## 1. Prerequisites Checklist

### Stripe Configuration
- [ ] **Stripe Customer Portal activated** at https://dashboard.stripe.com/test/settings/billing/portal
- [ ] **Webhook endpoint configured** in Stripe Dashboard pointing to your edge function
- [ ] **Product/Price ID validation**: Verify `src/config/stripe.ts` matches Stripe Dashboard
  - Premium: `price_1SQe1cF9Y0dnmu4YKaVKPSU6` → `prod_RdSS9f3xhCGOBD`
  - Enterprise: `price_1SQe2SF9Y0dnmu4YvHNx4m3L` → `prod_RdSSUQWWj8JXJW`
- [ ] **Supabase Environment Variables**:
  - `SITE_URL=https://goldsainte.ai`
  - `STRIPE_SECRET_KEY` (test mode)

### Database Setup
- [ ] `profiles.stripe_customer_id` column exists with index
- [ ] `user_subscriptions` table exists with proper RLS policies
- [ ] `journal_articles` indexes created for production scale

---

## 2. End-to-End Subscription Flow Testing

### Test Case 1: New User Upgrade to Premium
**Objective**: Verify complete signup → upgrade → payment → tier update flow

**Steps**:
1. Sign up with new email (test+premium@example.com)
2. Navigate to `/subscription` page
3. Verify "Free" tier is displayed
4. Click "Upgrade to Premium" button
5. **Expected**: Redirects to Stripe Checkout in same tab (not new window)
6. Complete payment with test card `4242 4242 4242 4242`
7. **Expected**: Redirects back to `/subscription?upgrade=success`
8. Verify toast shows "Subscription upgraded successfully!"
9. Verify UI now shows "Premium" tier with correct features
10. Check Supabase `user_subscriptions` table: `tier='premium'`, `status='active'`
11. Check Supabase `profiles`: `stripe_customer_id` is populated

**Pass Criteria**:
- ✅ Payment succeeds in Stripe Dashboard
- ✅ UI updates to Premium tier within 5 seconds
- ✅ `stripe_customer_id` cached in profiles table
- ✅ No console errors

---

### Test Case 2: Premium User Upgrade to Enterprise
**Objective**: Verify existing subscriber can upgrade tier

**Steps**:
1. Login as existing premium user
2. Navigate to `/subscription`
3. Verify "Premium" tier is displayed
4. Click "Upgrade to Enterprise" button
5. Complete Stripe checkout
6. Verify UI updates to "Enterprise" tier
7. Check Stripe Dashboard: subscription updated (not new subscription created)
8. Check `user_subscriptions`: `tier='enterprise'`

**Pass Criteria**:
- ✅ Single subscription in Stripe (updated, not duplicate)
- ✅ Tier updates correctly
- ✅ No downtime or errors

---

### Test Case 3: Customer Portal - Cancel Subscription
**Objective**: Verify users can manage subscriptions via Stripe portal

**Steps**:
1. Login as premium user
2. Navigate to `/subscription`
3. Click "Manage Subscription" button
4. **Expected**: Redirects to Stripe Customer Portal
5. Cancel subscription in portal
6. Return to app
7. Wait 10 seconds for webhook processing
8. Refresh `/subscription` page
9. Verify tier shows "Free" (or remains "Premium" until period end)

**Pass Criteria**:
- ✅ Portal opens successfully
- ✅ Cancellation processed
- ✅ Webhook fires and updates `user_subscriptions`
- ✅ UI reflects cancellation status

---

### Test Case 4: AI Subscription Flow
**Objective**: Verify consolidated AI subscription works

**Steps**:
1. Navigate to `/subscription` (AI tiers shown at top)
2. Click "Upgrade" on AI Basic tier
3. Complete checkout with `subscriptionType: 'ai'` metadata
4. **Expected**: Success redirect to `/subscription?type=ai&upgrade=success`
5. Verify AI usage limits updated
6. Check `user_subscriptions`: separate row for AI subscription

**Pass Criteria**:
- ✅ AI checkout uses correct price IDs from `AI_TIERS`
- ✅ Success toast differentiates AI vs main subscription
- ✅ AI usage tracking reflects new tier limits

---

## 3. Stripe Webhook Testing

### Test Webhook Events via Stripe CLI

**Setup**:
```bash
stripe listen --forward-to https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook
```

**Test Events**:

#### Event 1: `checkout.session.completed` (Main Subscription)
```bash
stripe trigger checkout.session.completed
```
**Expected**:
- Webhook logs show "Checkout session completed" in Supabase logs
- `user_subscriptions` table upserts with correct tier
- No duplicate subscriptions created

#### Event 2: `customer.subscription.updated`
```bash
stripe trigger customer.subscription.updated
```
**Expected**:
- Webhook processes update
- `user_subscriptions.tier` updates if product changed
- `updated_at` timestamp refreshes

#### Event 3: `customer.subscription.deleted`
```bash
stripe trigger customer.subscription.deleted
```
**Expected**:
- Webhook sets `tier='free'` in `user_subscriptions`
- User loses access to premium features

**Idempotency Test**:
- Send same webhook event twice rapidly
- **Expected**: Second event ignored (no duplicate processing)
- Check `webhook_events` table for idempotency key

---

## 4. Performance & Load Testing

### Test 1: Concurrent Checkouts
**Objective**: Verify system handles multiple simultaneous checkouts

**Steps**:
1. Simulate 10 concurrent users clicking "Upgrade" button
2. All complete checkout simultaneously
3. Verify all 10 succeed without errors

**Pass Criteria**:
- ✅ No race conditions
- ✅ All `stripe_customer_id` cached correctly
- ✅ No duplicate Stripe customers created

### Test 2: Subscription Check API Latency
**Objective**: Ensure `check-subscription` responds quickly

**Steps**:
1. Call `check-subscription` edge function 100 times
2. Measure average response time
3. **Expected**: <500ms average (with customer ID caching)

**Pass Criteria**:
- ✅ Average latency <500ms
- ✅ No rate limit errors from Stripe
- ✅ Cached customer IDs used (verify in logs)

---

## 5. Error Handling & Edge Cases

### Test 1: Expired Test Card
**Steps**:
1. Use test card that requires authentication: `4000 0027 6000 3184`
2. Complete 3D Secure flow
3. Verify payment succeeds after authentication

**Pass Criteria**:
- ✅ 3D Secure modal displays
- ✅ Payment completes after auth
- ✅ Subscription activates

### Test 2: Card Declined
**Steps**:
1. Use declined test card: `4000 0000 0000 0002`
2. Attempt checkout
3. **Expected**: Stripe shows error, user remains on checkout page
4. Verify user can retry with valid card

**Pass Criteria**:
- ✅ Graceful error message shown
- ✅ User can retry
- ✅ No partial subscriptions created

### Test 3: Webhook Failure Recovery
**Steps**:
1. Temporarily disable webhook endpoint
2. Complete subscription checkout
3. Payment succeeds but webhook fails
4. Re-enable webhook
5. Manually trigger webhook event from Stripe Dashboard

**Pass Criteria**:
- ✅ Manual webhook replay processes correctly
- ✅ Subscription activates post-recovery
- ✅ No data corruption

---

## 6. Authorization & Security Testing

### Test 1: Missing Authorization Header
**Steps**:
1. Call `create-checkout` edge function without `Authorization` header
2. **Expected**: 401 Unauthorized error

**Pass Criteria**:
- ✅ Returns 401 status
- ✅ Clear error message
- ✅ No stack traces exposed

### Test 2: Expired JWT Token
**Steps**:
1. Use expired or invalid JWT token in `Authorization` header
2. **Expected**: 401 error

### Test 3: CORS Preflight
**Steps**:
1. Open browser DevTools Network tab
2. Click "Upgrade" button
3. Verify OPTIONS preflight request returns 200
4. Verify `Access-Control-Allow-Methods: POST, OPTIONS` header present

**Pass Criteria**:
- ✅ Preflight succeeds (200 status)
- ✅ CORS headers correct
- ✅ POST request succeeds after preflight

---

## 7. Observability & Monitoring

### Logging Verification
**Check these logs in Supabase Functions Logs**:

#### create-checkout
- [ ] "Creating checkout session for user: {user_id}"
- [ ] "Using cached Stripe customer: {customer_id}"
- [ ] "Checkout session created: {session_id}"

#### check-subscription
- [ ] "Checking subscription for user: {user_id}"
- [ ] "Found active subscription: {subscription_id}"
- [ ] "Mapped product {product_id} to tier {tier}"

#### stripe-webhook
- [ ] "Webhook received: checkout.session.completed"
- [ ] "Processing standard subscription for user: {user_id}"
- [ ] "Upserted subscription: {subscription_id}"

### Error Tracking
**Verify these errors are logged clearly**:
- Missing environment variables (STRIPE_SECRET_KEY, SITE_URL)
- Invalid Stripe API responses
- Database query failures
- Missing user authentication

---

## 8. Cross-Browser & Device Testing

### Browser Matrix
- [ ] **Chrome Desktop** (latest)
- [ ] **Safari Desktop** (latest)
- [ ] **Firefox Desktop** (latest)
- [ ] **Chrome Mobile** (Android)
- [ ] **Safari Mobile** (iOS)

### Device-Specific Tests
**Mobile**:
- [ ] Subscription page layout responsive
- [ ] Stripe Checkout mobile-optimized
- [ ] Toast notifications visible
- [ ] No horizontal scroll

**Tablet**:
- [ ] Subscription tiers display correctly
- [ ] Customer portal opens in same tab

---

## 9. Rollback & Disaster Recovery

### Test Rollback Scenario
**Objective**: Verify system can revert to previous version if issues arise

**Steps**:
1. Note current working state
2. Make breaking change (e.g., remove CORS headers)
3. Deploy and verify it breaks
4. Use Lovable History → Revert to previous version
5. Verify subscription flow works again

**Pass Criteria**:
- ✅ Rollback completes in <5 minutes
- ✅ Previous functionality restored
- ✅ No data loss

---

## 10. Production Readiness Checklist

### Code Quality
- [ ] All Stripe functions use `apiVersion: "2024-06-20"`
- [ ] All edge functions include complete CORS headers
- [ ] Authorization headers passed on all user-invoked functions
- [ ] `src/config/stripe.ts` is single source of truth for price/product IDs
- [ ] `stripe_customer_id` caching implemented in all 5 core functions

### Configuration
- [ ] Stripe Customer Portal activated in dashboard
- [ ] Webhook endpoint configured and verified
- [ ] `SITE_URL` environment variable set
- [ ] Product/Price IDs validated against Stripe Dashboard
- [ ] Database indexes created for production scale

### Documentation
- [ ] Subscription flow documented for support team
- [ ] Error codes and troubleshooting guide created
- [ ] Webhook event handling documented

### Monitoring
- [ ] Logging covers all critical paths
- [ ] Error alerts configured (if available)
- [ ] Stripe Dashboard webhook logs reviewed

---

## 11. Sign-Off Criteria

**Before production launch, all must pass**:

- ✅ **P0 Blockers**: Zero P0 bugs on critical paths
- ✅ **E2E Tests**: All 4 end-to-end test cases pass
- ✅ **Webhook Tests**: All 3 webhook events process correctly
- ✅ **Performance**: Subscription check <500ms, concurrent checkouts succeed
- ✅ **Security**: Authorization and CORS tests pass
- ✅ **Observability**: All critical events logged
- ✅ **Cross-Browser**: Subscription flow works on all 5 browsers
- ✅ **Rollback**: Rollback procedure verified

---

## 12. Post-Launch Monitoring (First 7 Days)

### Daily Checks
- [ ] Review Stripe Dashboard for failed payments
- [ ] Check Supabase logs for errors in subscription functions
- [ ] Monitor webhook delivery success rate (>99%)
- [ ] Verify no duplicate customer creation

### Weekly Review
- [ ] Analyze conversion rate (free → premium)
- [ ] Review churn rate (subscription cancellations)
- [ ] Check average subscription check latency
- [ ] Audit any unusual patterns or errors

---

## Contact & Escalation

**If critical issues arise**:
1. Check Supabase Functions Logs first
2. Review Stripe Dashboard webhook logs
3. Verify environment variables unchanged
4. Check for Stripe API version drift
5. Escalate to technical lead if unresolved

---

**Phase 5 Status**: Ready for execution
**Last Updated**: 2025-01-12
