import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

// AI subscription tiers and limits
// NOTE: Keep this in sync with src/config/stripe.ts
// Edge functions can't import from src/, so this is duplicated here
export const AI_TIERS = {
  free: { name: 'Free', limit: 10, price: 0, priceId: null, productId: null },
  basic: { name: 'AI Basic', limit: 100, price: 30, priceId: 'price_1SR4wAFBVaLSioruemSf3tG8', productId: 'prod_TNqdEqGCkHdR1Z' },
  premium: { name: 'AI Premium', limit: 200, price: 50, priceId: 'price_1SR4xSF9Y0dnmu4YHArKXHLo', productId: 'prod_TNqessc2xZ5yYp' },
  enterprise: { name: 'AI Enterprise', limit: 350, price: 100, priceId: 'price_1SR4zAF9Y0dnmu4YKOLaM6lm', productId: 'prod_TNqgBullVM9ZAC' }
} as const;

export type AITier = keyof typeof AI_TIERS;

interface UsageCheckResult {
  allowed: boolean;
  tier: AITier;
  used: number;
  limit: number;
  remaining: number;
  resetDate: string;
  needsUpgrade: boolean;
}

/**
 * Check if user can make an AI API call and track usage
 */
export async function checkAndTrackAIUsage(
  userId: string | null,
  endpoint: string,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<UsageCheckResult> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Anonymous users get free tier
  if (!userId) {
    return {
      allowed: false,
      tier: 'free',
      used: 0,
      limit: AI_TIERS.free.limit,
      remaining: 0,
      resetDate: new Date().toISOString(),
      needsUpgrade: true
    };
  }

  // Get user's profile with AI subscription info
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('ai_subscription_tier, ai_calls_used, ai_calls_reset_at')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    console.error('Error fetching profile:', profileError);
    throw new Error('Failed to fetch user profile');
  }

  const tier = (profile.ai_subscription_tier as AITier) || 'free';
  const limit = AI_TIERS[tier].limit;
  const resetAt = new Date(profile.ai_calls_reset_at || new Date());
  
  // Check if reset period has passed (monthly reset)
  const now = new Date();
  if (resetAt < now) {
    // Reset usage count and set new reset date (30 days from now)
    const newResetDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    await supabase
      .from('profiles')
      .update({
        ai_calls_used: 0,
        ai_calls_reset_at: newResetDate.toISOString()
      })
      .eq('id', userId);

    // User has been reset, allow the call
    await logAIUsage(userId, endpoint, true, supabase);
    
    await supabase
      .from('profiles')
      .update({ ai_calls_used: 1 })
      .eq('id', userId);

    return {
      allowed: true,
      tier,
      used: 1,
      limit,
      remaining: limit - 1,
      resetDate: newResetDate.toISOString(),
      needsUpgrade: false
    };
  }

  const used = profile.ai_calls_used || 0;
  const remaining = limit - used;

  // Check if user has exceeded limit
  if (used >= limit) {
    await logAIUsage(userId, endpoint, false, supabase, 'Usage limit exceeded');
    
    return {
      allowed: false,
      tier,
      used,
      limit,
      remaining: 0,
      resetDate: resetAt.toISOString(),
      needsUpgrade: true
    };
  }

  // Allow the call and increment usage
  await logAIUsage(userId, endpoint, true, supabase);
  
  await supabase
    .from('profiles')
    .update({ ai_calls_used: used + 1 })
    .eq('id', userId);

  return {
    allowed: true,
    tier,
    used: used + 1,
    limit,
    remaining: remaining - 1,
    resetDate: resetAt.toISOString(),
    needsUpgrade: false
  };
}

/**
 * Log AI usage to the database
 */
async function logAIUsage(
  userId: string,
  endpoint: string,
  success: boolean,
  supabase: any,
  errorMessage?: string
) {
  await supabase
    .from('ai_usage_logs')
    .insert({
      user_id: userId,
      endpoint,
      success,
      error_message: errorMessage
    });
}

/**
 * Get user's current AI usage stats
 */
export async function getAIUsageStats(
  userId: string,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<UsageCheckResult> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: profile } = await supabase
    .from('profiles')
    .select('ai_subscription_tier, ai_calls_used, ai_calls_reset_at')
    .eq('id', userId)
    .single();

  if (!profile) {
    return {
      allowed: false,
      tier: 'free',
      used: 0,
      limit: AI_TIERS.free.limit,
      remaining: AI_TIERS.free.limit,
      resetDate: new Date().toISOString(),
      needsUpgrade: false
    };
  }

  const tier = (profile.ai_subscription_tier as AITier) || 'free';
  const limit = AI_TIERS[tier].limit;
  const used = profile.ai_calls_used || 0;
  const resetAt = new Date(profile.ai_calls_reset_at || new Date());
  
  return {
    allowed: used < limit,
    tier,
    used,
    limit,
    remaining: Math.max(0, limit - used),
    resetDate: resetAt.toISOString(),
    needsUpgrade: used >= limit
  };
}
