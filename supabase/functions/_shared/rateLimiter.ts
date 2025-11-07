/**
 * Rate Limiting Utility for Edge Functions
 * Prevents abuse and excessive API calls
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface RateLimitConfig {
  maxRequests: number;  // Maximum number of requests allowed
  windowMs: number;     // Time window in milliseconds
  identifier: string;   // Unique identifier for the client (IP, user ID, etc.)
  endpoint: string;     // API endpoint being rate limited
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;  // Seconds until rate limit resets
}

/**
 * Check and enforce rate limits
 * Uses database-backed rate limiting for consistency across instances
 */
export async function checkRateLimit(
  config: RateLimitConfig
): Promise<RateLimitResult> {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date();
    const windowStart = new Date(now.getTime() - config.windowMs);
    
    // Round window start to nearest minute for better grouping
    const roundedWindowStart = new Date(
      Math.floor(windowStart.getTime() / 60000) * 60000
    );

    console.log('🔒 [RATE LIMIT] Checking:', {
      identifier: config.identifier.substring(0, 20) + '...',
      endpoint: config.endpoint,
      windowStart: roundedWindowStart.toISOString()
    });

    // Get or create rate limit record for this window
    const { data: existingLimit, error: fetchError } = await supabaseClient
      .from('rate_limits')
      .select('*')
      .eq('identifier', config.identifier)
      .eq('endpoint', config.endpoint)
      .gte('window_start', roundedWindowStart.toISOString())
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Rate limit check error:', fetchError);
      // On error, allow the request but log it
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: new Date(now.getTime() + config.windowMs)
      };
    }

    // If no existing record, create one
    if (!existingLimit) {
      const { error: insertError } = await supabaseClient
        .from('rate_limits')
        .insert({
          identifier: config.identifier,
          endpoint: config.endpoint,
          request_count: 1,
          window_start: roundedWindowStart.toISOString()
        });

      if (insertError) {
        console.error('Failed to create rate limit record:', insertError);
      }

      console.log('✅ [RATE LIMIT] New window started - 1/' + config.maxRequests);
      
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: new Date(roundedWindowStart.getTime() + config.windowMs)
      };
    }

    // Check if limit exceeded
    if (existingLimit.request_count >= config.maxRequests) {
      const resetTime = new Date(
        new Date(existingLimit.window_start).getTime() + config.windowMs
      );
      const retryAfter = Math.ceil((resetTime.getTime() - now.getTime()) / 1000);
      
      console.log('❌ [RATE LIMIT] Exceeded:', {
        current: existingLimit.request_count,
        max: config.maxRequests,
        retryAfter
      });

      return {
        allowed: false,
        remaining: 0,
        resetTime,
        retryAfter
      };
    }

    // Increment counter
    const { error: updateError } = await supabaseClient
      .from('rate_limits')
      .update({
        request_count: existingLimit.request_count + 1,
        updated_at: now.toISOString()
      })
      .eq('id', existingLimit.id);

    if (updateError) {
      console.error('Failed to update rate limit:', updateError);
    }

    const remaining = config.maxRequests - (existingLimit.request_count + 1);
    console.log(`✅ [RATE LIMIT] Allowed - ${existingLimit.request_count + 1}/${config.maxRequests}`);

    return {
      allowed: true,
      remaining,
      resetTime: new Date(
        new Date(existingLimit.window_start).getTime() + config.windowMs
      )
    };
  } catch (error) {
    console.error('Rate limiter error:', error);
    // On unexpected errors, allow the request to prevent blocking legitimate traffic
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: new Date(Date.now() + config.windowMs)
    };
  }
}

/**
 * Get client identifier from request (IP address or user ID)
 */
export function getClientIdentifier(req: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }
  
  // Try to get IP from headers
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  
  return `ip:${ip}`;
}

/**
 * Create rate limit response with appropriate headers
 */
export function createRateLimitResponse(result: RateLimitResult, corsHeaders: any) {
  const headers = {
    ...corsHeaders,
    'Content-Type': 'application/json',
    'X-RateLimit-Limit': result.remaining.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetTime.toISOString(),
  };

  if (!result.allowed && result.retryAfter) {
    headers['Retry-After'] = result.retryAfter.toString();
  }

  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded. Please try again later.',
      retryAfter: result.retryAfter
    }),
    {
      status: 429,
      headers
    }
  );
}
