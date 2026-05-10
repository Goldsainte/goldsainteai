import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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

// Database-backed rate limiting using public.rate_limits.
// Survives edge function instance recycles and is shared across instances.
function getServiceClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

function getIdentifier(options: EnforceOptions): string {
  const base = options.keyType;
  const user = options.userId?.trim();
  if (user) return `${base}:${user}`;

  const forwarded = options.req?.headers.get("x-forwarded-for");
  const realIp = options.req?.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0]?.trim() || realIp || "anonymous";
  return `${base}:ip:${ip}`;
}

async function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = Date.now();
  // Bucket window_start to the current window so concurrent requests collide on the unique constraint
  const windowStartMs = Math.floor(now / windowMs) * windowMs;
  const windowStartIso = new Date(windowStartMs).toISOString();
  const windowReset = new Date(windowStartMs + windowMs);

  const supabase = getServiceClient();
  if (!supabase) {
    // Fail-open if service client is not configured
    return { allowed: true, remaining: maxRequests - 1, retryAfterSeconds: 0, windowReset };
  }

  // The rate_limits table uses (identifier, endpoint, window_start) as the unique key.
  // We split the identifier into endpoint (keyType prefix) and identifier (remainder).
  const [endpoint, ...rest] = identifier.split(":");
  const subject = rest.join(":") || "anonymous";

  // Upsert: insert if new, otherwise increment via separate update path.
  const { data: existing, error: selectError } = await supabase
    .from("rate_limits")
    .select("id, request_count")
    .eq("identifier", subject)
    .eq("endpoint", endpoint)
    .eq("window_start", windowStartIso)
    .maybeSingle();

  if (selectError) {
    console.error("rate-limit select error", selectError);
    return { allowed: true, remaining: maxRequests - 1, retryAfterSeconds: 0, windowReset };
  }

  let newCount = 1;
  if (existing) {
    newCount = (existing.request_count ?? 0) + 1;
    const { error: updateError } = await supabase
      .from("rate_limits")
      .update({ request_count: newCount })
      .eq("id", existing.id);
    if (updateError) {
      console.error("rate-limit update error", updateError);
      return { allowed: true, remaining: maxRequests - 1, retryAfterSeconds: 0, windowReset };
    }
  } else {
    const { error: insertError } = await supabase
      .from("rate_limits")
      .insert({
        identifier: subject,
        endpoint,
        request_count: 1,
        window_start: windowStartIso,
      });
    if (insertError) {
      // Likely a race; re-read and increment
      const { data: retry } = await supabase
        .from("rate_limits")
        .select("id, request_count")
        .eq("identifier", subject)
        .eq("endpoint", endpoint)
        .eq("window_start", windowStartIso)
        .maybeSingle();
      if (retry) {
        newCount = (retry.request_count ?? 0) + 1;
        await supabase
          .from("rate_limits")
          .update({ request_count: newCount })
          .eq("id", retry.id);
      }
    }
  }

  const allowed = newCount <= maxRequests;
  const remaining = Math.max(maxRequests - newCount, 0);
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
    const result = await checkRateLimit(identifier, maxRequests, windowMs);

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
