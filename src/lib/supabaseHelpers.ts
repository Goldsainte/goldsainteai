import { supabase } from "@/integrations/supabase/client";

/**
 * Global helper for invoking Supabase Edge Functions with authentication
 * Automatically handles auth header extraction and error formatting
 */
export async function invokeWithAuth<T = any>(
  functionName: string,
  options?: {
    body?: Record<string, any>;
    headers?: Record<string, string>;
  }
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

    // Invoke function
    const { data, error } = await supabase.functions.invoke(functionName, {
      ...options,
      headers,
    });

    if (error) {
      console.error(`[invokeWithAuth] Error calling ${functionName}:`, error);
      return { 
        data: null, 
        error: error.message || `Failed to call ${functionName}` 
      };
    }

    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[invokeWithAuth] Exception in ${functionName}:`, message);
    return { data: null, error: message };
  }
}

/**
 * Invoke a public Edge Function (no auth required)
 */
export async function invokePublic<T = any>(
  functionName: string,
  options?: {
    body?: Record<string, any>;
    headers?: Record<string, string>;
  }
): Promise<{ data: T | null; error: string | null }> {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, options);

    if (error) {
      console.error(`[invokePublic] Error calling ${functionName}:`, error);
      return { 
        data: null, 
        error: error.message || `Failed to call ${functionName}` 
      };
    }

    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[invokePublic] Exception in ${functionName}:`, message);
    return { data: null, error: message };
  }
}
