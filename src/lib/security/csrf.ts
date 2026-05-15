const CSRF_STORAGE_KEY = "csrf_token";
const DEFAULT_ENDPOINT = "/api/csrf-token";

const csrfEndpoint = import.meta.env.VITE_CSRF_TOKEN_ENDPOINT || DEFAULT_ENDPOINT;

// CSRF token endpoint only exists when explicitly configured (custom backend).
// In Lovable preview / static deployments, no-op to avoid 404 noise.
const CSRF_ENABLED = Boolean(import.meta.env.VITE_CSRF_TOKEN_ENDPOINT);

const hasSessionStorage = () => typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';

let inMemoryToken: string | null = null;
let pendingFetch: Promise<string | null> | null = null;

function cacheToken(token: string | null) {
  inMemoryToken = token;

  if (!hasSessionStorage()) {
    return;
  }

  if (token) {
    try {
      window.sessionStorage.setItem(CSRF_STORAGE_KEY, token);
    } catch (error) {
      console.warn("Unable to persist CSRF token in sessionStorage", error);
    }
  } else {
    try {
      window.sessionStorage.removeItem(CSRF_STORAGE_KEY);
    } catch (error) {
      console.warn("Unable to clear CSRF token from sessionStorage", error);
    }
  }
}

export function getCachedCSRFToken(): string | null {
  if (inMemoryToken) {
    return inMemoryToken;
  }

  if (!hasSessionStorage()) {
    return null;
  }

  try {
    const stored = window.sessionStorage.getItem(CSRF_STORAGE_KEY);
    if (stored) {
      inMemoryToken = stored;
      return stored;
    }
  } catch (error) {
    console.warn("Unable to read CSRF token from sessionStorage", error);
  }

  return null;
}

async function requestToken(method: "GET" | "POST"): Promise<string | null> {
  if (!CSRF_ENABLED) {
    return null;
  }
  try {
    const response = await fetch(csrfEndpoint, {
      method,
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.warn(`CSRF token endpoint responded with ${response.status}`);
      return null;
    }

    const body = await response.json().catch(() => ({}));
    const token = typeof body?.token === "string" ? body.token : null;

    cacheToken(token);
    return token;
  } catch (error) {
    console.warn("Failed to retrieve CSRF token from server", error);
    return null;
  }
}

export async function ensureCSRFToken(): Promise<string | null> {
  if (getCachedCSRFToken()) {
    return inMemoryToken;
  }

  if (!pendingFetch) {
    pendingFetch = requestToken("GET").finally(() => {
      pendingFetch = null;
    });
  }

  return pendingFetch;
}

export async function refreshCSRFToken(): Promise<string | null> {
  pendingFetch = requestToken("POST").finally(() => {
    pendingFetch = null;
  });
  return pendingFetch;
}

export function clearCSRFToken() {
  cacheToken(null);
}

export function getCSRFHeaders(): Record<string, string> {
  const token = getCachedCSRFToken();
  return token ? { "X-CSRF-Token": token } : {};
}
