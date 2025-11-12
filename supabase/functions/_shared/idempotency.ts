import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { logger } from "./structuredLogger.ts";

/**
 * Generate idempotency key for Stripe operations
 * Format: {operation}_{userId}_{timestamp}_{random}
 */
export function generateIdempotencyKey(operation: string, userId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${operation}_${userId}_${timestamp}_${random}`;
}

/**
 * Check if an idempotency key has been used before
 * Returns the cached result if found
 */
export async function checkIdempotencyCache(
  key: string
): Promise<{ exists: boolean; result?: any }> {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data, error } = await supabase
      .from("idempotency_cache")
      .select("*")
      .eq("idempotency_key", key)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found" which is expected
      logger.error("Failed to check idempotency cache", error);
      return { exists: false };
    }

    if (data) {
      logger.info("Idempotency key found in cache", { key });
      return { exists: true, result: data.response_data };
    }

    return { exists: false };
  } catch (error) {
    logger.error("Error checking idempotency cache", error as Error);
    return { exists: false };
  }
}

/**
 * Store result in idempotency cache
 */
export async function storeIdempotencyResult(
  key: string,
  result: any,
  expiresInHours: number = 24
): Promise<void> {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    const { error } = await supabase.from("idempotency_cache").insert({
      idempotency_key: key,
      response_data: result,
      expires_at: expiresAt.toISOString(),
    });

    if (error) {
      logger.error("Failed to store idempotency result", error);
    } else {
      logger.info("Idempotency result cached", { key });
    }
  } catch (error) {
    logger.error("Error storing idempotency result", error as Error);
  }
}

/**
 * Wrapper for Stripe operations with automatic idempotency handling
 */
export async function withIdempotency<T>(
  key: string,
  operation: () => Promise<T>,
  options: { cache?: boolean; expiresInHours?: number } = {}
): Promise<T> {
  const { cache = true, expiresInHours = 24 } = options;

  // Check cache if enabled
  if (cache) {
    const cached = await checkIdempotencyCache(key);
    if (cached.exists) {
      logger.info("Returning cached result for idempotency key", { key });
      return cached.result as T;
    }
  }

  // Execute operation with idempotency key
  try {
    const result = await operation();

    // Store in cache if enabled
    if (cache) {
      await storeIdempotencyResult(key, result, expiresInHours);
    }

    return result;
  } catch (error) {
    logger.error("Operation failed with idempotency key", error as Error, { key });
    throw error;
  }
}
