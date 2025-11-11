/**
 * CSRF Protection Utilities
 * Prevents Cross-Site Request Forgery attacks on state-changing operations
 */

const CSRF_TOKEN_KEY = "csrf_token";
const CSRF_TOKEN_HEADER = "X-CSRF-Token";

/**
 * Generate a random CSRF token
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Store CSRF token in session storage
 */
export function storeCSRFToken(token: string): void {
  sessionStorage.setItem(CSRF_TOKEN_KEY, token);
}

/**
 * Get CSRF token from session storage
 */
export function getCSRFToken(): string | null {
  return sessionStorage.getItem(CSRF_TOKEN_KEY);
}

/**
 * Initialize CSRF protection (call on app load)
 */
export function initCSRFProtection(): string {
  let token = getCSRFToken();

  if (!token) {
    token = generateCSRFToken();
    storeCSRFToken(token);
  }

  return token;
}

/**
 * Get headers with CSRF token for API requests
 */
export function getCSRFHeaders(): Record<string, string> {
  const token = getCSRFToken();

  if (!token) {
    console.warn("CSRF token not found. Call initCSRFProtection() first.");
    return {};
  }

  return {
    [CSRF_TOKEN_HEADER]: token,
  };
}

/**
 * Validate CSRF token on the server side
 */
export function validateCSRFToken(
  requestHeaders: Headers,
  sessionToken: string
): boolean {
  const tokenFromHeader = requestHeaders.get(CSRF_TOKEN_HEADER);

  if (!tokenFromHeader) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  return constantTimeCompare(tokenFromHeader, sessionToken);
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Clear CSRF token (call on logout)
 */
export function clearCSRFToken(): void {
  sessionStorage.removeItem(CSRF_TOKEN_KEY);
}

/**
 * Refresh CSRF token (call periodically or after sensitive operations)
 */
export function refreshCSRFToken(): string {
  const newToken = generateCSRFToken();
  storeCSRFToken(newToken);
  return newToken;
}
