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

// ============================================================================
// BRAND ENFORCEMENT (Jul 26).
//
// 19 legacy senders build raw HTML and post it straight to Resend, so real
// customers received unstyled or half-styled mail — a tip notification, a
// purchase confirmation — while the branded pipeline sent beautiful ones.
// Hand-templating 19 functions hours before launch is not a safe change; this
// guard is already the single choke point every legacy sender passes through,
// so branding is enforced HERE instead.
//
// Behaviour: if payload.html is not already inside a Goldsainte shell, wrap it.
// Detection is deliberately generous — any of several house markers counts as
// branded — because a false "unbranded" reading only double-wraps (ugly),
// while a false "branded" reading lets an unbranded mail through (the bug).
// Anything already rendered by _layout.tsx, brandEmail.ts or the transactional
// templates passes untouched.
// ============================================================================
const LOGO_URL =
  "https://iwdevxltjuedijrcdejs.supabase.co/storage/v1/object/public/email-assets/wordmark-green-v2.png";

const BRAND_MARKERS = [
  LOGO_URL,
  "This is an automated message",
  "Playfair Display",
  "#f7f3ea",
  "goldsainte-branded",
];

function looksBranded(html: string): boolean {
  if (!html) return true; // nothing to brand (text-only send)
  return BRAND_MARKERS.some((m) => html.includes(m));
}

/** Wrap arbitrary body HTML in the house shell. Mirrors brandEmail.ts. */
function brandWrap(inner: string, subject?: string): string {
  const heading = (subject || "Goldsainte").replace(/[<>]/g, "");
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<!--goldsainte-branded-->
</head>
<body style="margin:0;padding:0;background:#f7f3ea;font-family:'Helvetica Neue',Arial,sans-serif;color:#0a2225;">
  <div style="width:100%;background:#f7f3ea;padding:48px 16px;">
    <div style="max-width:560px;margin:0 auto;background:#f7f3ea;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tbody><tr>
        <td align="center" style="padding:8px 0 28px;"><img src="${LOGO_URL}" alt="Goldsainte" style="height:22px;width:auto;max-width:240px;display:block;margin:0 auto;"/></td>
      </tr></tbody></table>
      <hr style="border:0;border-top:1px solid rgba(10,34,37,0.15);margin:0 0 28px;"/>
      <h1 style="font-family:Georgia,serif;font-weight:400;font-size:30px;line-height:1.2;color:#0a2225;margin:0 0 20px;text-align:center;letter-spacing:-0.01em;">${heading}</h1>
      <div style="font-size:15px;line-height:1.7;color:#0a2225;">${inner}</div>
      <p style="font-size:13px;line-height:1.7;color:#0a2225;opacity:0.8;text-align:center;margin:40px 0 0;">If you have any questions, please contact <a href="mailto:support@goldsainte.com" style="color:#0c4d47;">Goldsainte Support</a>.</p>
      <p style="font-size:10px;letter-spacing:0.1em;color:#0a2225;opacity:0.45;text-align:center;text-transform:uppercase;padding:16px 0 0;">This is an automated message from Goldsainte</p>
    </div>
  </div>
</body></html>`;
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

      // Enforce house branding on any raw-HTML sender (see note above).
      if (typeof payload.html === "string" && !looksBranded(payload.html)) {
        console.log("[resend-guard] wrapping unbranded email", { subject: payload.subject });
        payload.html = brandWrap(payload.html, payload.subject);
      }

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
