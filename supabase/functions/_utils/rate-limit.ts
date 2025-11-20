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

function getIdentifier(options: EnforceOptions): string {
  const base = options.keyType;
  const user = options.userId?.trim();
  if (user) return `${base}:${user}`;

  const forwarded = options.req?.headers.get("x-forwarded-for");
  const realIp = options.req?.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0]?.trim() || realIp || "anonymous";
  return `${base}:ip:${ip}`;
}

async function incrementCounter(
  keyParts: Deno.KvKey,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  const kv = await Deno.openKv();
  const now = Date.now();
  const bucket = Math.floor(now / windowMs) * windowMs;
  const bucketKey: Deno.KvKey = [...keyParts, bucket];
  const existing = await kv.get<number>(bucketKey);
  const expireIn = windowMs - (now - bucket);
  const nextCount = (existing.value ?? 0) + 1;

  const atomic = kv.atomic().check(existing ?? { key: bucketKey, versionstamp: null }).set(
    bucketKey,
    nextCount,
    { expireIn }
  );

  const result = await atomic.commit();
  if (!result.ok) {
    // Retry once if contention occurred
    return incrementCounter(keyParts, maxRequests, windowMs);
  }

  const windowReset = new Date(bucket + windowMs);
  const remaining = Math.max(maxRequests - nextCount, 0);
  const allowed = nextCount <= maxRequests;
  const retryAfterSeconds = allowed
    ? 0
    : Math.max(Math.ceil((windowReset.getTime() - now) / 1000), 0);

  return { allowed, remaining, retryAfterSeconds, windowReset };
}

export async function enforceRateLimit(options: EnforceOptions): Promise<Response | null> {
  const defaults = DEFAULT_LIMITS[options.keyType];
  const maxRequests = options.maxRequestsOverride ?? defaults.maxRequests;
  const windowSeconds = options.windowSecondsOverride ?? defaults.windowSeconds;
  const windowMs = windowSeconds * 1000;

  try {
    const identifier = getIdentifier(options);
    const keyParts: Deno.KvKey = ["rate-limit", identifier];
    const result = await incrementCounter(keyParts, maxRequests, windowMs);

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
