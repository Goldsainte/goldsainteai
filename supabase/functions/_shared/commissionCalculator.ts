/**
 * Shared commission calculation utilities
 */

export interface CommissionResult {
  baseCommission: number;
  tierMultiplier: number;
  commissionWithTier: number;
  platformFee: number;
  netPayout: number;
  holdDays: number;
}

export interface TierConfig {
  bronze: number;
  gold: number;
  platinum: number;
}

export const TIER_MULTIPLIERS: TierConfig = {
  bronze: 1.0,
  gold: 1.1, // +10%
  platinum: 1.2, // +20%
};

export const BASE_COMMISSION_RATES: Record<string, number> = {
  booking: 0.4, // 40% for package bookings
  shop: 0.3, // 30% for shop sales
  gift: 0.7, // 70% for virtual gifts
  affiliate: 0.15, // 15% for affiliate revenue (variable)
  partnership: 0.2, // 20% for partnership earnings (negotiated)
};

export const HOST_FEE_RATE = 0.035; // 3.5% of booking subtotal (deducted from creator)
export const GUEST_FEE_RATE = 0.035; // 3.5% of booking subtotal (added to traveler)
export const PLATFORM_FEE_RATE = HOST_FEE_RATE; // backward compat — host-side fee

export function calculateCommission(
  amount: number,
  transactionType: keyof typeof BASE_COMMISSION_RATES,
  tier: keyof TierConfig
): CommissionResult {
  // Get base commission rate
  const baseRate = BASE_COMMISSION_RATES[transactionType] || 0.1;
  const baseCommission = amount * baseRate;

  // Apply tier multiplier
  const tierMultiplier = TIER_MULTIPLIERS[tier] || 1.0;
  const commissionWithTier = baseCommission * tierMultiplier;

  // Calculate platform fee
  const platformFee = commissionWithTier * PLATFORM_FEE_RATE;
  const netPayout = commissionWithTier - platformFee;

  // Hold period: 14 days for bookings, immediate for others
  const holdDays = transactionType === "booking" ? 14 : 0;

  return {
    baseCommission,
    tierMultiplier,
    commissionWithTier,
    platformFee,
    netPayout,
    holdDays,
  };
}

export function getHoldUntilDate(holdDays: number): Date | null {
  if (holdDays === 0) return null;

  const date = new Date();
  date.setDate(date.getDate() + holdDays);
  return date;
}

export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function validateCommissionRequest(data: any): { valid: boolean; error?: string } {
  if (!data.creatorId) {
    return { valid: false, error: "Creator ID is required" };
  }

  if (!data.transactionType || !BASE_COMMISSION_RATES[data.transactionType]) {
    return { valid: false, error: "Invalid transaction type" };
  }

  if (!data.amount || data.amount <= 0) {
    return { valid: false, error: "Amount must be greater than 0" };
  }

  if (!data.sourceId) {
    return { valid: false, error: "Source ID is required" };
  }

  return { valid: true };
}
