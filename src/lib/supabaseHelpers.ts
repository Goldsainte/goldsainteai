import { supabase } from "@/integrations/supabase/client";

/**
 * PRODUCTION-CRITICAL: Global helper for invoking Supabase Edge Functions with authentication
 * 
 * FEATURES:
 * - Automatic Authorization header with Bearer token
 * - Exponential backoff retries for transient failures (3 attempts)
 * - Proper error handling and logging
 * - Prevents random 401s under load-balanced auth
 * 
 * @param functionName - Name of the edge function to invoke
 * @param options - Request options (body, headers, etc.)
 * @param retries - Number of retry attempts for transient failures (default: 2)
 * @returns Promise with typed response { data, error }
 */
export async function invokeWithAuth<T = any>(
  functionName: string,
  options?: {
    body?: Record<string, any>;
    headers?: Record<string, string>;
  },
  retries = 2
): Promise<{ data: T | null; error: string | null }> {
  try {
    // Get current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error(`[invokeWithAuth] Session error for ${functionName}:`, sessionError);
      return { data: null, error: "Authentication error. Please log in again." };
    }

    const accessToken = sessionData.session?.access_token;
    
    if (!accessToken) {
      console.error(`[invokeWithAuth] No access token for ${functionName}`);
      return { data: null, error: "Not authenticated. Please log in." };
    }

    // Merge auth header with any custom headers
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      ...options?.headers,
    };

    // Attempt invocation with exponential backoff for retries
    let lastError: any;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const { data, error } = await supabase.functions.invoke(functionName, {
          ...options,
          headers,
        });

        // Success or non-retryable error (auth/permission errors don't retry)
        if (!error || 
            error.message?.includes('401') || 
            error.message?.includes('403') ||
            error.message?.includes('Unauthorized')) {
          if (error) {
            console.error(`[invokeWithAuth] Error calling ${functionName}:`, error);
            return { 
              data: null, 
              error: error.message || `Failed to call ${functionName}` 
            };
          }
          return { data, error: null };
        }

        lastError = error;

        // Exponential backoff before retry
        if (attempt < retries) {
          const delayMs = Math.min(1000 * Math.pow(2, attempt), 5000);
          console.log(`[RETRY] Attempt ${attempt + 1}/${retries + 1} failed for ${functionName}, retrying in ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      } catch (err) {
        lastError = err;
        
        // Don't retry on network errors (TypeError indicates network issue)
        if (attempt < retries && !(err instanceof TypeError)) {
          const delayMs = Math.min(1000 * Math.pow(2, attempt), 5000);
          console.log(`[RETRY] Exception in ${functionName}, retrying in ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        } else {
          break;
        }
      }
    }

    const message = lastError instanceof Error ? lastError.message : String(lastError);
    console.error(`[invokeWithAuth] ${functionName} failed after ${retries + 1} attempts:`, message);
    return { data: null, error: message || `Failed to call ${functionName}` };

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[invokeWithAuth] Exception in ${functionName}:`, message);
    return { data: null, error: message };
  }
}

/**
 * Invoke a public Edge Function (no auth required)
 * 
 * FEATURES:
 * - No authentication headers
 * - Exponential backoff retries for transient failures
 * - Proper error handling and logging
 * 
 * @param functionName - Name of the edge function to invoke
 * @param options - Request options (body, headers, etc.)
 * @param retries - Number of retry attempts (default: 2)
 */
export async function invokePublic<T = any>(
  functionName: string,
  options?: {
    body?: Record<string, any>;
    headers?: Record<string, string>;
  },
  retries = 2
): Promise<{ data: T | null; error: string | null }> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const { data, error } = await supabase.functions.invoke(functionName, options);

      if (!error) {
        return { data, error: null };
      }

      lastError = error;

      // Exponential backoff before retry
      if (attempt < retries) {
        const delayMs = Math.min(1000 * Math.pow(2, attempt), 5000);
        console.log(`[RETRY] Public function ${functionName} retry ${attempt + 1}/${retries + 1} in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (err) {
      lastError = err;
      
      if (attempt < retries) {
        const delayMs = Math.min(1000 * Math.pow(2, attempt), 5000);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      } else {
        break;
      }
    }
  }

  const message = lastError instanceof Error ? lastError.message : String(lastError);
  console.error(`[invokePublic] ${functionName} failed after ${retries + 1} attempts:`, message);
  return { 
    data: null, 
    error: message || `Failed to call ${functionName}` 
  };
}
