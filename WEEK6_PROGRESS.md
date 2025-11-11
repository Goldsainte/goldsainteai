# Week 6: Creator Monetization & Revenue Tracking

**Status:** In Progress (0% complete)  
**Focus:** Creator dashboard enhancements, tier progression, commission transparency, revenue tracking

---

## Overview

Week 6 implements the creator monetization infrastructure including:
- Tier progression UI (Bronze → Gold → Platinum)
- Commission transparency across all revenue streams
- Revenue tracking dashboard
- Stripe Connect payout integration
- Package booking commission logic with tier-based rates

---

## P0 Items (Critical)

### 1. Creator Tier Progression UI ⏳
**Status:** Pending  
**Priority:** P0  
**Files:**
- [ ] `src/components/creator/TierProgressCard.tsx` - Visual tier progress indicator
- [ ] `src/components/creator/TierBenefitsModal.tsx` - Detailed tier benefits breakdown
- [ ] `src/hooks/useCreatorTier.ts` - Hook for tier data and progression logic

**Requirements:**
- Display current tier (Bronze/Gold/Platinum) with visual badge
- Show progress toward next tier (metrics: followers, engagement, booking volume)
- Commission rate display per tier (Bronze: base, Gold: +10%, Platinum: +20%)
- Next tier requirements and estimated time to unlock
- Tier benefits comparison table

**Acceptance:**
- Creator sees current tier and progress on dashboard
- Commission rates clearly displayed for current and next tier
- Real-time tier progression updates based on activity

---

### 2. Commission Transparency Dashboard ⏳
**Status:** Pending  
**Priority:** P0  
**Files:**
- [ ] `src/components/creator/CommissionDashboard.tsx` - Main commission tracking UI
- [ ] `src/components/creator/RevenueBreakdown.tsx` - Detailed revenue source breakdown
- [ ] `src/hooks/useCreatorRevenue.ts` - Hook for revenue data aggregation

**Requirements:**
- Aggregate revenue from all sources:
  - Package bookings (up to 40% commission)
  - Shop product sales
  - Content views (virtual gifts)
  - Affiliate revenue
  - Partnership earnings
- Display commission calculations with tier multipliers
- Show platform fees and net payouts
- Filter by date range, revenue stream, payout status

**Acceptance:**
- Creator sees total earnings across all revenue streams
- Commission calculations are transparent and auditable
- Filtering and date range selection work correctly

---

### 3. Package Booking Commission Logic ⏳
**Status:** Pending  
**Priority:** P0  
**Files:**
- [ ] `supabase/functions/calculate-creator-commission/index.ts` - Commission calculation edge function
- [ ] `supabase/functions/_shared/commissionCalculator.ts` - Shared commission logic

**Requirements:**
- Base commission: up to 40% of package booking value
- Tier multipliers: Bronze (1.0x), Gold (1.1x), Platinum (1.2x)
- Platform fee calculation (subtract platform cut)
- Handle partial refunds and cancellations
- Commission hold period (14 days after trip completion)
- Automatic commission release to creator balance

**Acceptance:**
- Commission correctly calculated based on tier and package value
- Platform fees properly deducted
- Commission held for 14 days after trip completion
- Refunds adjust commission balances correctly

---

## P1 Items (High Priority)

### 4. Creator Payout Dashboard ⏳
**Status:** Pending  
**Priority:** P1  
**Files:**
- [ ] `src/components/creator/PayoutDashboard.tsx` - Payout history and initiation UI
- [ ] `supabase/functions/initiate-creator-payout/index.ts` - Payout processing edge function

**Requirements:**
- Display available balance (released commissions)
- Show pending balance (commission hold period)
- Payout history with status tracking
- Initiate payout button (requires Stripe Connect onboarding)
- Bank account management via Stripe Connect
- Minimum payout threshold ($50)
- Email notifications for successful payouts

**Acceptance:**
- Creator sees available and pending balances
- Payout initiation works with Stripe Connect in test mode
- Payout history shows all past transfers with status
- Email notification sent on successful payout

---

### 5. Revenue Stream Tracking ⏳
**Status:** Pending  
**Priority:** P1  
**Files:**
- [ ] Database migration for `creator_revenue_transactions` table
- [ ] `supabase/functions/record-revenue-transaction/index.ts` - Transaction logging
- [ ] `src/components/creator/RevenueTimelineChart.tsx` - Revenue over time visualization

**Requirements:**
- Track all revenue transactions with metadata:
  - Transaction ID, creator ID, revenue source type
  - Amount, commission rate, tier at time of transaction
  - Platform fee, net payout amount
  - Associated booking/product/content ID
  - Transaction timestamp
- Generate revenue reports (daily, weekly, monthly)
- Export revenue data as CSV
- Real-time revenue updates via Supabase subscriptions

**Acceptance:**
- All revenue transactions logged to database
- Revenue timeline chart displays earnings over time
- CSV export includes all transaction details
- Real-time updates when new revenue is earned

---

### 6. Shop Product Sales Tracking ⏳
**Status:** Pending  
**Priority:** P1  
**Files:**
- [ ] `src/components/creator/ShopSalesDashboard.tsx` - Shop sales analytics UI
- [ ] `supabase/functions/process-shop-sale/index.ts` - Shop sale commission processing

**Requirements:**
- Track product sales with commission calculations
- Display top-selling products
- Show revenue per product
- Commission rate for shop sales (30% to creator, tier multiplier applies)
- Inventory tracking and low-stock alerts
- Product performance metrics (views, conversions, revenue)

**Acceptance:**
- Shop sales appear in revenue dashboard
- Commission correctly calculated with tier multiplier
- Top products ranked by revenue
- Low-stock alerts trigger at threshold

---

## P2 Items (Nice to Have)

### 7. Creator Analytics Dashboard ⏳
**Status:** Pending  
**Priority:** P2  
**Files:**
- [ ] `src/components/creator/AnalyticsDashboard.tsx` - Comprehensive analytics UI
- [ ] `src/components/creator/EngagementMetrics.tsx` - Engagement tracking

**Requirements:**
- Follower growth over time
- Content engagement metrics (views, likes, shares)
- Booking conversion rates
- Average order value
- Customer lifetime value
- Top-performing content and packages

**Acceptance:**
- Analytics dashboard shows key metrics
- Charts display trends over time
- Metrics update in real-time

---

## Database Schema

### Creator Revenue Transactions Table
```sql
CREATE TABLE creator_revenue_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id),
  transaction_type TEXT NOT NULL, -- 'booking', 'shop_sale', 'gift', 'affiliate', 'partnership'
  source_id UUID, -- booking_id, product_id, etc.
  amount DECIMAL(10, 2) NOT NULL,
  commission_rate DECIMAL(5, 2) NOT NULL,
  tier_multiplier DECIMAL(3, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) NOT NULL,
  net_payout DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending', -- 'pending', 'held', 'released', 'paid_out'
  hold_until TIMESTAMP,
  released_at TIMESTAMP,
  paid_out_at TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_creator_revenue_creator ON creator_revenue_transactions(creator_id);
CREATE INDEX idx_creator_revenue_status ON creator_revenue_transactions(status);
CREATE INDEX idx_creator_revenue_type ON creator_revenue_transactions(transaction_type);
```

### Creator Balances Table
```sql
CREATE TABLE creator_balances (
  creator_id UUID PRIMARY KEY REFERENCES profiles(id),
  available_balance DECIMAL(10, 2) DEFAULT 0,
  pending_balance DECIMAL(10, 2) DEFAULT 0,
  total_earned DECIMAL(10, 2) DEFAULT 0,
  total_paid_out DECIMAL(10, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  last_payout_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT now()
);
```

---

## Testing Checklist

### Creator Tier Progression
- [ ] Bronze tier displays correctly on dashboard
- [ ] Progress bar updates based on activity metrics
- [ ] Tier upgrade triggers when requirements met
- [ ] Commission rates update after tier change
- [ ] Tier benefits modal shows accurate information

### Commission Calculations
- [ ] Package booking commission calculated correctly (base + tier)
- [ ] Shop sale commission calculated correctly (30% + tier)
- [ ] Platform fees deducted properly
- [ ] Partial refunds adjust commission correctly
- [ ] Commission hold period enforced (14 days)

### Payout Processing
- [ ] Available balance displayed accurately
- [ ] Pending balance shows unreleased commissions
- [ ] Payout initiation requires Stripe Connect setup
- [ ] Minimum payout threshold enforced ($50)
- [ ] Payout history shows all transactions
- [ ] Email notification sent on successful payout

### Revenue Tracking
- [ ] All revenue sources logged to database
- [ ] Revenue timeline chart displays correctly
- [ ] CSV export includes all transaction details
- [ ] Real-time updates work via Supabase subscriptions

---

## Next Steps (Week 7 Preview)

Week 7 will focus on:
1. Advanced creator features (analytics deep dive, A/B testing)
2. Customer-facing booking flow optimizations
3. Admin tools for platform management
4. Final security audit and penetration testing
5. Performance optimization and caching strategies

---

## Notes

- All commission calculations must be transparent and auditable
- Stripe Connect onboarding required before payouts can be initiated
- Commission hold period protects against chargebacks/refunds
- Tier progression should encourage creator growth and engagement
- Revenue tracking enables tax reporting and accounting compliance
