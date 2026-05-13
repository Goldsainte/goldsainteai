// Suppression-list guard for outbound Resend API calls.
//
// Importing this module installs a global fetch wrapper that intercepts every
// request to https://api.resend.com/emails and filters the `to` / `cc` / `bcc`
// recipient lists against the `suppressed_emails` table. Recipients on the
// suppression list (unsubscribes, bounces, complaints) are silently dropped
// before the request reaches Resend.
//
// This is the single legal-compliance choke point for legacy edge functions
// that send mail directly via Resend. The new transactional pipeline already
// checks suppression server-side; this guard brings the ~28 legacy senders
// up to the same standard without rewriting each one.
//
// CAN-SPAM / GDPR / PECR: do NOT remove or bypass this guard.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

// Small in-memory cache to avoid hammering the DB on bursts. 60s TTL.
const cache = new Map<string, { suppressed: boolean; expires: number }>();
const CACHE_TTL_MS = 60_000;

let admin: ReturnType<typeof createClient> | null = null;
function getAdmin() {
  if (!admin && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
  }
  return admin;
}

function normalize(email: string): string {
  return email.trim().toLowerCase();
}

async function isSuppressed(email: string): Promise<boolean> {
  const key = normalize(email);
  if (!key) return false;
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.suppressed;

  const sb = getAdmin();
  if (!sb) return false; // fail-open if env not configured (local/dev)

  try {
    const { data, error } = await sb
      .from("suppressed_emails")
      .select("email")
      .eq("email", key)
      .maybeSingle();
    if (error) {
      console.warn("[resend-guard] suppression lookup failed", error.message);
      return false; // fail-open on transient DB error
    }
    const suppressed = !!data;
    cache.set(key, { suppressed, expires: Date.now() + CACHE_TTL_MS });
    return suppressed;
  } catch (e) {
    console.warn("[resend-guard] suppression lookup threw", e);
    return false;
  }
}

async function filterList(list: unknown): Promise<string[] | undefined> {
  if (list == null) return undefined;
  const arr = Array.isArray(list) ? list : [list];
  const emails = arr.filter((x): x is string => typeof x === "string");
  const checks = await Promise.all(
    emails.map(async (e) => ({ e, drop: await isSuppressed(e) })),
  );
  const kept = checks.filter((c) => !c.drop).map((c) => c.e);
  const dropped = checks.filter((c) => c.drop).map((c) => c.e);
  if (dropped.length) {
    console.log("[resend-guard] dropped suppressed recipients", {
      dropped_count: dropped.length,
      kept_count: kept.length,
    });
  }
  return kept;
}

const originalFetch = globalThis.fetch;

globalThis.fetch = async function guardedFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  try {
    const url = typeof input === "string"
      ? input
      : input instanceof URL
      ? input.toString()
      : (input as Request).url;

    if (
      url.startsWith(RESEND_ENDPOINT) &&
      (init?.method ?? "GET").toUpperCase() === "POST" &&
      typeof init?.body === "string"
    ) {
      let payload: any;
      try {
        payload = JSON.parse(init.body as string);
      } catch {
        return originalFetch(input, init);
      }

      const filteredTo = await filterList(payload.to);
      const filteredCc = await filterList(payload.cc);
      const filteredBcc = await filterList(payload.bcc);

      const hasAnyRecipient =
        (filteredTo && filteredTo.length > 0) ||
        (filteredCc && filteredCc.length > 0) ||
        (filteredBcc && filteredBcc.length > 0);

      if (!hasAnyRecipient) {
        console.log("[resend-guard] all recipients suppressed; skipping send", {
          subject: payload.subject,
        });
        // Return a synthetic 200 so callers treat this as a no-op success.
        return new Response(
          JSON.stringify({
            id: `suppressed-${crypto.randomUUID()}`,
            suppressed: true,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      payload.to = filteredTo;
      if (filteredCc !== undefined) payload.cc = filteredCc;
      if (filteredBcc !== undefined) payload.bcc = filteredBcc;

      const newInit: RequestInit = {
        ...init,
        body: JSON.stringify(payload),
      };
      return originalFetch(input, newInit);
    }
  } catch (e) {
    console.warn("[resend-guard] guard error, falling through", e);
  }
  return originalFetch(input, init);
};

export {}; // side-effect module
