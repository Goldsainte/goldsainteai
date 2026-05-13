// Shared CORS helper with per-request origin reflection across an allowlist.
// Browsers only accept a single Access-Control-Allow-Origin value per response,
// so we reflect the request's Origin if (and only if) it is in our allowlist.
// Anything outside the allowlist falls back to the production domain (or the
// ALLOWED_ORIGIN env override) — which effectively blocks the cross-origin call.

const STATIC_ALLOWED = new Set<string>([
  "https://goldsainte.ai",
  "https://www.goldsainte.ai",
  "https://goldsainteai.lovable.app",
  "http://localhost:5173",
  "http://localhost:8080",
  "http://localhost:3000",
]);

// Allow any *.lovable.app (preview/sandbox subdomains) and the configured project preview.
const ALLOWED_HOST_RE = /^https:\/\/[a-z0-9-]+\.lovable\.app$/i;

function isAllowed(origin: string): boolean {
  if (!origin) return false;
  if (STATIC_ALLOWED.has(origin)) return true;
  if (ALLOWED_HOST_RE.test(origin)) return true;
  const extra = Deno.env.get("ALLOWED_ORIGIN");
  if (extra && origin === extra) return true;
  return false;
}

export function resolveAllowedOrigin(req?: Request): string {
  const origin = req?.headers.get("origin") ?? "";
  if (isAllowed(origin)) return origin;
  return Deno.env.get("ALLOWED_ORIGIN") ?? "https://goldsainte.ai";
}

export function buildCorsHeaders(
  req?: Request,
  opts?: { allowHeaders?: string; allowMethods?: string },
): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
    "Access-Control-Allow-Headers":
      opts?.allowHeaders ??
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": opts?.allowMethods ?? "POST, GET, OPTIONS",
    "Vary": "Origin",
  };
}
