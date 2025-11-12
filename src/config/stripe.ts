/**
 * Centralized Stripe configuration
 * Single source of truth for price/product mappings and tier definitions
 */

export type SubscriptionTier = 'free' | 'premium' | 'enterprise';
export type AITier = 'free' | 'pro' | 'unlimited';

// Subscription tier configuration
export const SUBSCRIPTION_TIERS = {
  free: {
    priceId: null,
    productId: null,
    name: 'Free',
    rank: 0,
    features: ['Basic features', 'Limited searches', 'Community support'],
  },
  premium: {
    priceId: 'price_1QkqnhP5O16LVKANe2NLzpZv',
    productId: 'prod_RdSS9f3xhCGOBD',
    name: 'Premium',
    rank: 1,
    features: ['Unlimited searches', 'Priority support', 'Advanced filters'],
  },
  enterprise: {
    priceId: 'price_1QkqoCP5O16LVKANNBvx2oHR',
    productId: 'prod_RdSSUQWWj8JXJW',
    name: 'Enterprise',
    rank: 2,
    features: ['Everything in Premium', 'Dedicated support', 'Custom integrations'],
  },
} as const;

// AI usage tier configuration
// NOTE: Keep this in sync with supabase/functions/_shared/aiUsageTracker.ts
export const AI_TIERS = {
  free: {
    priceId: null,
    productId: null,
    name: 'Free',
    monthlyQuota: 10,
    price: 0,
  },
  basic: {
    priceId: 'price_1SR4wAFBVaLSioruemSf3tG8',
    productId: 'prod_TNqdEqGCkHdR1Z',
    name: 'AI Basic',
    monthlyQuota: 100,
    price: 30,
  },
  premium: {
    priceId: 'price_1SR4xSF9Y0dnmu4YHArKXHLo',
    productId: 'prod_TNqessc2xZ5yYp',
    name: 'AI Premium',
    monthlyQuota: 200,
    price: 50,
  },
  enterprise: {
    priceId: 'price_1SR4zAF9Y0dnmu4YKOLaM6lm',
    productId: 'prod_TNqgBullVM9ZAC',
    name: 'AI Enterprise',
    monthlyQuota: 350,
    price: 100,
  },
} as const;

/**
 * Get tier by product ID
 */
export function getTierByProductId(productId: string): SubscriptionTier {
  for (const [tier, config] of Object.entries(SUBSCRIPTION_TIERS)) {
    if (config.productId === productId) {
      return tier as SubscriptionTier;
    }
  }
  return 'free';
}

/**
 * Get tier by price ID
 */
export function getTierByPriceId(priceId: string): SubscriptionTier {
  for (const [tier, config] of Object.entries(SUBSCRIPTION_TIERS)) {
    if (config.priceId === priceId) {
      return tier as SubscriptionTier;
    }
  }
  return 'free';
}

/**
 * Compare tiers by rank
 * Returns true if newTier is an upgrade from currentTier
 */
export function isUpgrade(currentTier: SubscriptionTier, newTier: SubscriptionTier): boolean {
  return SUBSCRIPTION_TIERS[newTier].rank > SUBSCRIPTION_TIERS[currentTier].rank;
}

/**
 * Compare tiers by rank
 * Returns true if newTier is a downgrade from currentTier
 */
export function isDowngrade(currentTier: SubscriptionTier, newTier: SubscriptionTier): boolean {
  return SUBSCRIPTION_TIERS[newTier].rank < SUBSCRIPTION_TIERS[currentTier].rank;
}
