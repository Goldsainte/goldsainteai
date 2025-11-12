import { logger } from "./structuredLogger.ts";

interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
}

/**
 * Retry an async operation with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  operationName: string,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    backoffMultiplier = 2,
    retryableErrors = [
      "rate_limit",
      "api_error",
      "connection",
      "timeout",
      "temporarily_unavailable",
    ],
  } = options;

  let lastError: Error;
  let delay = initialDelayMs;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      
      if (attempt > 0) {
        logger.info(`Operation succeeded after ${attempt} retries`, {
          operationName,
          attempt,
        });
      }
      
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if error is retryable
      const isRetryable = retryableErrors.some((retryableError) =>
        lastError.message.toLowerCase().includes(retryableError.toLowerCase())
      );

      if (!isRetryable || attempt === maxRetries) {
        logger.error(`Operation failed after ${attempt} attempts`, lastError, {
          operationName,
          totalAttempts: attempt + 1,
          isRetryable,
        });
        throw lastError;
      }

      logger.warn(`Operation failed, retrying...`, {
        operationName,
        attempt: attempt + 1,
        maxRetries,
        nextRetryIn: delay,
        error: lastError.message,
      });

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
      
      // Increase delay for next attempt (exponential backoff)
      delay = Math.min(delay * backoffMultiplier, maxDelayMs);
    }
  }

  throw lastError!;
}

/**
 * Specific retry wrapper for Stripe API calls
 */
export async function retryStripeOperation<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  return retryWithBackoff(operation, operationName, {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 5000,
    retryableErrors: [
      "rate_limit",
      "api_error",
      "connection_error",
      "timeout",
      "lock_timeout",
    ],
  });
}
