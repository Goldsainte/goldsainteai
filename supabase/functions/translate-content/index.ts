// translate-content v1 — Goldsainte content translation (messaging phase 1).
// Cache-first machine translation for user-generated content (messages now,
// listings later). Content-addressed: sha256(source text) + target language.
// Any given text is translated at most once per language, ever; after that
// it's a free cache read.
//
// POST { text: string, targetLang: "en"|"fr"|"es"|"de"|"it"|"pt"|"ar"|"ja"|"ko"|"zh" }
//   -> { translation: string, sourceLang: string, cached: boolean, same: boolean }
// If the text is already in the target language, returns the original with
// same=true (and caches that verdict so the model is never asked twice).
//
// Auth: verify_jwt (project default) — signed-in users only.
// Rate limited: 300 translation calls per user per day via ai_usage_logs
// (cache hits don't count; fail-open if the table is absent).
// Self-contained (no _shared imports) for dashboard-paste deploys.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";
const MODEL = "gpt-4o-mini";
const MAX_CHARS = 4000;
const DAILY_LIMIT = 300;

const SUPPORTED = new Set(["en", "fr", "es", "de", "it", "pt", "ar", "ja", "ko", "zh"]);

const STATIC_ALLOWED = new Set<string>([
  "https://goldsainte.ai",
  "https://www.goldsainte.ai",
  "https://goldsainte.com",
  "https://www.goldsainte.com",
  "https://goldsainteai.lovable.app",
  "http://localhost:5173",
  "http://localhost:8080",
  "http://localhost:3000",
]);
const ALLOWED_HOST_RE =
  /^https:\/\/[a-z0-9-]+\.(lovable\.app|lovableproject\.com)$/i;

function resolveAllowedOrigin(req?: Request): string {
  const origin = req?.headers.get("origin") ?? "";
  if (
    STATIC_ALLOWED.has(origin) ||
    ALLOWED_HOST_RE.test(origin) ||
    (Deno.env.get("ALLOWED_ORIGIN") && origin === Deno.env.get("ALLOWED_ORIGIN"))
  ) {
    return origin;
  }
  return Deno.env.get("ALLOWED_ORIGIN") ?? "https://goldsainte.ai";
}

function corsHeaders(req?: Request): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function json(req: Request, status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }
  if (req.method !== "POST") {
    return json(req, 405, { error: "Method not allowed" });
  }

  try {
    const { text, targetLang } = await req.json().catch(() => ({}));

    if (typeof text !== "string" || !text.trim()) {
      return json(req, 400, { error: "text is required" });
    }
    if (typeof targetLang !== "string" || !SUPPORTED.has(targetLang)) {
      return json(req, 400, { error: "targetLang must be one of: " + [...SUPPORTED].join(", ") });
    }
    if (text.length > MAX_CHARS) {
      return json(req, 400, { error: `text exceeds ${MAX_CHARS} characters` });
    }

    // Identify the caller (verify_jwt already required a valid token; this
    // resolves who it is, for rate limiting).
    const authHeader = req.headers.get("authorization") ?? "";
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData } = await userClient.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) {
      return json(req, 401, { error: "Not authenticated" });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const normalized = text.trim();
    const sourceHash = await sha256Hex(normalized);

    // ---- 1. Cache read (free path; no rate limit) ----
    const { data: hit } = await admin
      .from("content_translations")
      .select("translated_text, source_lang")
      .eq("source_hash", sourceHash)
      .eq("target_lang", targetLang)
      .maybeSingle();

    if (hit) {
      const same = hit.source_lang === targetLang;
      return json(req, 200, {
        translation: hit.translated_text,
        sourceLang: hit.source_lang ?? "unknown",
        cached: true,
        same,
      });
    }

    // ---- 2. Rate limit (model calls only; fail-open if table absent) ----
    try {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count } = await admin
        .from("ai_usage_logs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("endpoint", "translate_content")
        .gte("created_at", since);
      if ((count ?? 0) >= DAILY_LIMIT) {
        return json(req, 429, { error: "Daily translation limit reached. Try again tomorrow." });
      }
      await admin.from("ai_usage_logs").insert({ user_id: userId, endpoint: "translate_content" });
    } catch (_) {
      // ai_usage_log absent or differently shaped: fail open, as the other
      // AI functions do (table name/shape drift stays non-fatal).
    }

    if (!OPENAI_API_KEY) {
      return json(req, 500, { error: "Translation is not configured" });
    }

    // ---- 3. Translate ----
    const system = [
      "You are a professional translator for a luxury travel marketplace where travelers, creators, and agents message each other about real trips and money.",
      `Translate the user's message into the language with ISO 639-1 code "${targetLang}".`,
      "Preserve meaning, tone, and register. Keep verbatim and untranslated: personal names, place names used as proper nouns, brand names (including Goldsainte and Stripe), URLs, email addresses, prices, numbers, dates, and currency symbols.",
      "If the message is ALREADY in the target language, do not rewrite it — return it unchanged.",
      'Respond ONLY with minified JSON, no markdown fences: {"source_lang":"<ISO 639-1 of the original>","translation":"<translated or unchanged text>"}',
    ].join(" ");

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: normalized },
        ],
      }),
    });

    if (!aiRes.ok) {
      const detail = await aiRes.text().catch(() => "");
      console.error("translate-content: OpenAI error", aiRes.status, detail.slice(0, 300));
      return json(req, 502, { error: "Translation failed. Please try again." });
    }

    const aiJson = await aiRes.json();
    const raw = aiJson?.choices?.[0]?.message?.content ?? "";
    let parsed: { source_lang?: string; translation?: string } = {};
    try {
      parsed = JSON.parse(raw);
    } catch (_) {
      console.error("translate-content: unparseable model output", raw.slice(0, 200));
      return json(req, 502, { error: "Translation failed. Please try again." });
    }

    const sourceLang = (parsed.source_lang || "unknown").toLowerCase().slice(0, 5);
    const same = sourceLang === targetLang;
    const translation = same ? normalized : (parsed.translation || "").trim();
    if (!translation) {
      return json(req, 502, { error: "Translation failed. Please try again." });
    }

    // ---- 4. Cache write (permanent; last-write-wins is fine here) ----
    await admin.from("content_translations").upsert({
      source_hash: sourceHash,
      target_lang: targetLang,
      source_lang: sourceLang,
      translated_text: translation,
      char_count: normalized.length,
    });

    return json(req, 200, { translation, sourceLang, cached: false, same });
  } catch (err) {
    console.error("translate-content: unhandled", err);
    return json(req, 500, { error: "Translation failed. Please try again." });
  }
});
