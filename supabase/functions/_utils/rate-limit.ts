export type RateLimitKey = "auth" | "ai" | "api";

interface RateLimitDefaults {
  maxRequests: number;
  windowSeconds: number;
}

interface EnforceOptions {
  keyType: RateLimitKey;
  userId?: string | null;
  req?: Request;
  corsHeaders?: Record<string, string>;
  maxRequestsOverride?: number;
  windowSecondsOverride?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  windowReset: Date;
}

const DEFAULT_LIMITS: Record<RateLimitKey, RateLimitDefaults> = {
  auth: { maxRequests: 10, windowSeconds: 60 },
  ai: { maxRequests: 5, windowSeconds: 60 },
  api: { maxRequests: 20, windowSeconds: 60 },
};

// Simple in-memory rate limit store (per edge function instance)
// Note: This resets when the function instance is recycled, which is acceptable
// for basic rate limiting in edge functions
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function getIdentifier(options: EnforceOptions): string {
  const base = options.keyType;
  const user = options.userId?.trim();
  if (user) return `${base}:${user}`;

  const forwarded = options.req?.headers.get("x-forwarded-for");
  const realIp = options.req?.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0]?.trim() || realIp || "anonymous";
  return `${base}:ip:${ip}`;
}

function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const windowReset = new Date(now + windowMs);
  
  // Clean up expired entries periodically
  if (Math.random() < 0.1) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetAt < now) {
        rateLimitStore.delete(key);
      }
    }
  }

  const existing = rateLimitStore.get(identifier);
  
  // If no existing entry or window expired, create new entry
  if (!existing || existing.resetAt < now) {
    rateLimitStore.set(identifier, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      retryAfterSeconds: 0,
      windowReset,
    };
  }

  // Increment counter
  existing.count += 1;
  const allowed = existing.count <= maxRequests;
  const remaining = Math.max(maxRequests - existing.count, 0);
  const retryAfterSeconds = allowed
    ? 0
    : Math.max(Math.ceil((existing.resetAt - now) / 1000), 0);

  return {
    allowed,
    remaining,
    retryAfterSeconds,
    windowReset: new Date(existing.resetAt),
  };
}

export async function enforceRateLimit(options: EnforceOptions): Promise<Response | null> {
  const defaults = DEFAULT_LIMITS[options.keyType];
  const maxRequests = options.maxRequestsOverride ?? defaults.maxRequests;
  const windowSeconds = options.windowSecondsOverride ?? defaults.windowSeconds;
  const windowMs = windowSeconds * 1000;

  try {
    const identifier = getIdentifier(options);
    const result = checkRateLimit(identifier, maxRequests, windowMs);

    if (result.allowed) {
      return null;
    }

    const headers = {
      ...(options.corsHeaders || {}),
      "Content-Type": "application/json",
      "Retry-After": result.retryAfterSeconds.toString(),
      "X-RateLimit-Limit": maxRequests.toString(),
      "X-RateLimit-Remaining": result.remaining.toString(),
      "X-RateLimit-Reset": result.windowReset.toISOString(),
    };

    return new Response(
      JSON.stringify({
        error: "rate_limit_exceeded",
        retry_after: result.retryAfterSeconds,
      }),
      { status: 429, headers }
    );
  } catch (error) {
    console.error("rate-limit util error", error);
    return null;
  }
}
