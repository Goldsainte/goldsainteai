// ai-proposal-polish — turns an agent/creator's rough notes into a polished
// Goldsainte-toned proposal pitch + headline. Self-contained (no _shared
// imports) so it can be deployed as a new function via dashboard paste.
//
// POST body: { notes: string, headline?: string, destination?: string,
//              dates?: string, budgetMin?: number, budgetMax?: number,
//              role?: "agent" | "creator" }
// Returns:   { headline: string, pitch: string }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";
const MODEL = "gpt-4o-mini";

// ── CORS: reflect origin across the same allowlist the rest of the app uses ──
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
    Vary: "Origin",
  };
}

function jsonResponse(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }
  if (!OPENAI_API_KEY) {
    return jsonResponse(req, { error: "OPENAI_API_KEY not configured" }, 500);
  }

  try {
    // ── Auth (same pattern as ai-content-tools) ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse(req, { error: "Unauthorized" }, 401);
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claims, error: ce } = await supabase.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (ce || !claims?.claims) {
      return jsonResponse(req, { error: "Unauthorized" }, 401);
    }

    const body = await req.json();
    const notes = String(body.notes ?? "").slice(0, 2400).trim();
    if (notes.length < 10) {
      return jsonResponse(
        req,
        { error: "Add a few rough notes first (at least 10 characters)." },
        400,
      );
    }
    const currentHeadline = String(body.headline ?? "").slice(0, 120).trim();
    const destination = String(body.destination ?? "").slice(0, 120).trim();
    const dates = String(body.dates ?? "").slice(0, 80).trim();
    const role = body.role === "creator" ? "travel creator" : "travel agent";
    const budgetMin = Number(body.budgetMin) || 0;
    const budgetMax = Number(body.budgetMax) || 0;
    const budget =
      budgetMin || budgetMax
        ? `$${budgetMin.toLocaleString()}${budgetMax ? ` – $${budgetMax.toLocaleString()}` : "+"}`
        : "";

    const system = [
      "You are the in-house proposal writer for Goldsainte, a luxury travel marketplace.",
      "You turn a specialist's rough notes into a polished pitch a traveler will read.",
      "Voice: warm, confident, first person, concrete. Quiet luxury — never salesy, no superlatives stacking, no emojis, no hashtags, no markdown.",
      "Never invent facts, prices, inclusions, or guarantees that are not in the notes. Preserve every factual detail the notes contain.",
      'Output strict JSON: { "headline": string, "pitch": string }.',
      "headline: max 9 words, title case, specific to this trip (no quotes inside).",
      "pitch: 120–190 words, 2–3 short paragraphs separated by \\n\\n, written as the specialist speaking directly to this traveler.",
    ].join(" ");

    const user = [
      `Specialist role: ${role}`,
      destination ? `Trip destination: ${destination}` : "",
      dates ? `Trip dates: ${dates}` : "",
      budget ? `Traveler's stated budget: ${budget}` : "",
      currentHeadline ? `Their current headline draft: "${currentHeadline}"` : "",
      "",
      "Their rough notes:",
      `"""${notes}"""`,
      "",
      "Write the polished headline and pitch.",
    ]
      .filter((l) => l !== "")
      .join("\n");

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.7,
        max_tokens: 550,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`OpenAI ${resp.status}: ${text}`);
    }
    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);

    const headline = String(parsed.headline ?? "").slice(0, 120).trim();
    const pitch = String(parsed.pitch ?? "").trim();
    if (!pitch) throw new Error("Empty pitch returned");

    return jsonResponse(req, { headline, pitch });
  } catch (e) {
    console.error("ai-proposal-polish error", e);
    return jsonResponse(req, { error: String((e as Error)?.message ?? e) }, 500);
  }
});
