import { supabase } from "@/integrations/supabase/client";
import { getEdgeFunctionUrl, SUPABASE_PUBLISHABLE_KEY } from "@/lib/backendConfig";
import { toast } from "sonner";

interface EdgeFunctionOptions {
  body?: any;
  timeout?: number; // milliseconds
  showToastOnError?: boolean;
  retryOnNetworkError?: boolean;
  maxRetries?: number;
}

/**
 * Wrapper for calling Supabase edge functions with:
 * - Timeout handling
 * - Rate limit (429) error handling
 * - Payment required (402) error handling
 * - Network error retry with exponential backoff
 * - Consistent error messaging
 */
export async function invokeEdgeFunction<T = any>(
  functionName: string,
  options: EdgeFunctionOptions = {}
): Promise<{ data: T | null; error: any }> {
  const {
    body,
    timeout = 30000,
    showToastOnError = true,
    retryOnNetworkError = true,
    maxRetries = 3,
  } = options;

  // Retry logic with exponential backoff
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const { data, error } = await supabase.functions.invoke(functionName, {
          body,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (error) {
          // Check for rate limit errors
          if (
            error.message?.includes('429') ||
            error.message?.toLowerCase().includes('rate limit') ||
            error.message?.toLowerCase().includes('too many requests')
          ) {
            if (showToastOnError) {
              toast.error('Too many requests. Please wait a moment and try again.', {
                duration: 5000,
              });
            }
            return { data: null, error: { type: 'RATE_LIMIT', message: error.message } };
          }

          // Check for payment required errors
          if (
            error.message?.includes('402') ||
            error.message?.toLowerCase().includes('payment required') ||
            error.message?.toLowerCase().includes('credits')
          ) {
            if (showToastOnError) {
              toast.error('Service temporarily unavailable. Please try again later.', {
                duration: 5000,
              });
            }
            return { data: null, error: { type: 'PAYMENT_REQUIRED', message: error.message } };
          }

          // Other errors - throw to be caught by retry logic
          throw error;
        }

        return { data, error: null };
      } catch (err: any) {
        clearTimeout(timeoutId);

        // Handle timeout
        if (err.name === 'AbortError') {
          if (showToastOnError) {
            toast.error('Request timed out. Please try again.', {
              duration: 5000,
            });
          }
          return { data: null, error: { type: 'TIMEOUT', message: 'Request timed out' } };
        }

        throw err;
      }
    } catch (err: any) {
      const isLastAttempt = attempt === maxRetries - 1;
      const msg = String(err?.message || '').toLowerCase();
      const isNetworkError =
        msg.includes('network') ||
        msg.includes('fetch') ||
        msg.includes('connection') ||
        msg.includes('edge function') ||
        msg.includes('failed to send a request');

      // If it's a network error and we should retry, wait and retry
      if (retryOnNetworkError && isNetworkError && !isLastAttempt) {
        console.log(`Network error on attempt ${attempt + 1}, retrying...`);
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }

      // Last attempt or non-network error
      console.error(`Edge function ${functionName} error:`, err);
      if (showToastOnError) {
        toast.error(
          err.message || 'Something went wrong. Please try again.',
          { duration: 5000 }
        );
      }
      return { data: null, error: err };
    }
  }

  // Should never reach here, but TypeScript needs it
  return {
    data: null,
    error: { type: 'UNKNOWN', message: 'Maximum retries exceeded' },
  };
}

/**
 * Streaming version for AI responses
 */
export async function invokeStreamingEdgeFunction(
  functionName: string,
  options: EdgeFunctionOptions & {
    onChunk?: (chunk: string) => void;
    onComplete?: () => void;
  } = {}
): Promise<{ error: any | null }> {
  const {
    body,
    timeout = 60000, // Longer timeout for streaming
    showToastOnError = true,
    onChunk,
    onComplete,
  } = options;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(
      getEdgeFunctionUrl(functionName),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    // Check for rate limit or payment errors
    if (response.status === 429) {
      if (showToastOnError) {
        toast.error('Too many requests. Please wait a moment and try again.', {
          duration: 5000,
        });
      }
      return { error: { type: 'RATE_LIMIT', status: 429 } };
    }

    if (response.status === 402) {
      if (showToastOnError) {
        toast.error('Service temporarily unavailable. Please try again later.', {
          duration: 5000,
        });
      }
      return { error: { type: 'PAYMENT_REQUIRED', status: 402 } };
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Handle streaming response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No response body');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      if (onChunk) {
        onChunk(chunk);
      }
    }

    if (onComplete) {
      onComplete();
    }

    return { error: null };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      if (showToastOnError) {
        toast.error('Request timed out. Please try again.', {
          duration: 5000,
        });
      }
      return { error: { type: 'TIMEOUT', message: 'Request timed out' } };
    }

    console.error(`Streaming edge function ${functionName} error:`, err);
    if (showToastOnError) {
      toast.error(err.message || 'Something went wrong. Please try again.', {
        duration: 5000,
      });
    }
    return { error: err };
  }
}
