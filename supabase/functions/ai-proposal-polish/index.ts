// ai-proposal-polish v2 — Goldsainte AI proposal writer.
// Modes:
//   "polish"       (default) rough notes -> polished pitch + headline
//   "full_draft"   trip request context -> pre-fills the ENTIRE wizard
//   "scope_polish" rough inclusion/exclusion lines -> clean lists
//   "cancel_polish" rough terms -> polished cancellation paragraph
// Self-contained (no _shared imports) for dashboard-paste deploys.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";
const MODEL = "gpt-4o-mini";

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

async function callOpenAI(system: string, user: string, maxTokens: number) {
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.7,
      max_tokens: maxTokens,
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
  return JSON.parse(data.choices?.[0]?.message?.content || "{}");
}

const VOICE =
  "Voice: warm, confident, first person, concrete. Quiet luxury — never salesy, no stacked superlatives, no emojis, no hashtags, no markdown. Never invent facts, prices, inclusions, or guarantees that are not supported by the provided context.";

const clampInt = (v: unknown, lo: number, hi: number, fallback: number) => {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(hi, Math.max(lo, n));
};
const cleanLines = (arr: unknown, max: number) =>
  Array.isArray(arr)
    ? arr.map((x) => String(x).trim()).filter(Boolean).slice(0, max)
    : [];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }
  if (!OPENAI_API_KEY) {
    return jsonResponse(req, { error: "OPENAI_API_KEY not configured" }, 500);
  }

  try {
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
    const mode = String(body.mode ?? "polish");

    const notes = String(body.notes ?? "").slice(0, 2400).trim();
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
    const interests = cleanLines(body.interests, 10).join(", ");
    const requestDescription = String(body.request_description ?? "")
      .slice(0, 1200)
      .trim();

    // ── MODE: polish (unchanged behavior) ──
    if (mode === "polish") {
      if (notes.length < 10) {
        return jsonResponse(
          req,
          { error: "Add a few rough notes first (at least 10 characters)." },
          400,
        );
      }
      const system = [
        "You are the in-house proposal writer for Goldsainte, a luxury travel marketplace.",
        "You turn a specialist's rough notes into a polished pitch a traveler will read.",
        VOICE,
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
      ].filter((l) => l !== "").join("\n");

      const out = await callOpenAI(system, user, 550);
      const headline = String(out.headline ?? "").slice(0, 120).trim();
      const pitch = String(out.pitch ?? "").trim();
      if (!pitch) throw new Error("Empty pitch returned");
      return jsonResponse(req, { headline, pitch });
    }

    // ── MODE: full_draft — pre-fill the entire wizard ──
    if (mode === "full_draft") {
      if (!destination && notes.length < 10) {
        return jsonResponse(
          req,
          { error: "Need a destination or a few rough notes to draft from." },
          400,
        );
      }
      const system = [
        "You are the in-house proposal writer for Goldsainte, a luxury travel marketplace.",
        `A ${role} is responding to a traveler's trip request. Draft their complete proposal.`,
        VOICE,
        "Inclusions must be services the specialist plausibly delivers (planning, bookings, reservations, transfers, support) — phrased as short single-line commitments. Exclusions are standard carve-outs (international flights unless noted, personal shopping, travel insurance, visa fees, meals not listed).",
        "If a budget range is given, price_per_person MUST be an integer within that range.",
        "Output strict JSON with EXACTLY these keys:",
        '{ "headline": string, "pitch": string, "itinerary_summary": string, "inclusions": string[], "exclusions": string[], "price_per_person": number, "deposit_percentage": number, "delivery_days": number, "cancellation_terms": string, "booking_management": boolean, "on_trip_support": boolean }',
        "headline: max 9 words, title case. pitch: 120–190 words, 2–3 paragraphs separated by \\n\\n.",
        "itinerary_summary: one line per day in the form 'Day N: ...' covering the trip length implied by the dates (default 7 days if unknown).",
        "inclusions: 5–9 lines. exclusions: 3–6 lines. deposit_percentage: 20–40 (default 25). delivery_days: 3–10 (days to deliver the full itinerary after acceptance).",
        "cancellation_terms: 2–3 sentences, plain language, consistent with a 25% deposit and tiered refunds; no legal jargon.",
        "booking_management/on_trip_support: true when the notes or a full-service posture support them.",
      ].join(" ");
      const user = [
        `Specialist role: ${role}`,
        destination ? `Trip destination: ${destination}` : "",
        dates ? `Trip dates: ${dates}` : "",
        budget ? `Traveler's stated budget (per person): ${budget}` : "",
        interests ? `Traveler's interests: ${interests}` : "",
        requestDescription ? `Traveler's request, in their words:\n"""${requestDescription}"""` : "",
        notes ? `Specialist's rough notes:\n"""${notes}"""` : "",
        "",
        "Draft the complete proposal JSON now.",
      ].filter((l) => l !== "").join("\n");

      const out = await callOpenAI(system, user, 1100);

      const lo = budgetMin > 0 ? budgetMin : 1;
      const hi = budgetMax > 0 ? budgetMax : 1_000_000;
      const draft = {
        headline: String(out.headline ?? "").slice(0, 120).trim(),
        pitch: String(out.pitch ?? "").trim(),
        itinerary_summary: String(out.itinerary_summary ?? "").slice(0, 2000).trim(),
        inclusions: cleanLines(out.inclusions, 9),
        exclusions: cleanLines(out.exclusions, 6),
        price_per_person: clampInt(out.price_per_person, lo, hi, budgetMax || budgetMin || 0),
        deposit_percentage: clampInt(out.deposit_percentage, 10, 50, 25),
        delivery_days: clampInt(out.delivery_days, 1, 30, 7),
        cancellation_terms: String(out.cancellation_terms ?? "").slice(0, 900).trim(),
        booking_management: Boolean(out.booking_management),
        on_trip_support: Boolean(out.on_trip_support),
      };
      if (!draft.pitch || draft.inclusions.length === 0) {
        throw new Error("Incomplete draft returned");
      }
      return jsonResponse(req, draft);
    }

    // ── MODE: scope_polish — tidy inclusion/exclusion lists ──
    if (mode === "scope_polish") {
      const incRaw = String(body.inclusions_raw ?? "").slice(0, 2000).trim();
      const excRaw = String(body.exclusions_raw ?? "").slice(0, 1200).trim();
      if (incRaw.length < 5) {
        return jsonResponse(
          req,
          { error: "Add a few rough inclusion lines first." },
          400,
        );
      }
      const system = [
        "You clean up scope-of-services lists for luxury travel proposals.",
        VOICE,
        "Rewrite each item as a short, professional single line. Deduplicate. Do NOT add services that are not in the raw lines — only clarify what is there. Keep every real commitment.",
        'Output strict JSON: { "inclusions": string[], "exclusions": string[] }.',
      ].join(" ");
      const user = [
        destination ? `Trip destination: ${destination}` : "",
        "Raw inclusions (one per line):",
        `"""${incRaw}"""`,
        excRaw ? `Raw exclusions (one per line):\n"""${excRaw}"""` : "Raw exclusions: (none provided — return standard exclusions ONLY if clearly implied, otherwise an empty array)",
        "",
        "Return the cleaned lists.",
      ].filter((l) => l !== "").join("\n");

      const out = await callOpenAI(system, user, 500);
      return jsonResponse(req, {
        inclusions: cleanLines(out.inclusions, 12),
        exclusions: cleanLines(out.exclusions, 8),
      });
    }

    // ── MODE: cancel_polish — refine cancellation terms ──
    if (mode === "cancel_polish") {
      const termsRaw = String(body.terms_raw ?? "").slice(0, 1500).trim();
      if (termsRaw.length < 10) {
        return jsonResponse(
          req,
          { error: "Add a few rough notes about your terms first." },
          400,
        );
      }
      const system = [
        "You rewrite cancellation terms for luxury travel proposals.",
        VOICE,
        "Plain language, 2–4 sentences, firm but gracious. Preserve every number, percentage, and deadline exactly as given. Do not add new conditions.",
        'Output strict JSON: { "cancellation_terms": string }.',
      ].join(" ");
      const user = `Rough terms:\n"""${termsRaw}"""\n\nRewrite them.`;
      const out = await callOpenAI(system, user, 300);
      const terms = String(out.cancellation_terms ?? "").slice(0, 900).trim();
      if (!terms) throw new Error("Empty terms returned");
      return jsonResponse(req, { cancellation_terms: terms });
    }

    // ── MODE: contract_draft — fill the template contract's prose fields ──
    if (mode === "contract_draft") {
      const travelerName = String(body.traveler_name ?? "").slice(0, 80).trim();
      const agency = String(body.agency ?? "").slice(0, 80).trim();
      const tripTitle = String(body.trip_title ?? "").slice(0, 120).trim();
      const totalCost = Number(body.total_cost) || 0;
      const depositAmount = Number(body.deposit_amount) || 0;
      if (!destination && !tripTitle) {
        return jsonResponse(req, { error: "Need trip context to draft from." }, 400);
      }
      const system = [
        "You draft the variable clauses of a travel services agreement for Goldsainte, a luxury travel marketplace.",
        VOICE,
        "Plain, professional contract language a traveler can read without a lawyer. 2-4 sentences per clause unless noted. Use ONLY the monetary figures provided — never invent amounts, percentages, or deadlines beyond sensible defaults expressed in words.",
        'Output strict JSON with EXACTLY these keys: { "services_description": string, "cancellation_terms": string, "modification_policy": string, "traveler_duties": string, "insurance_recommendation": string, "liability_limit": string }',
        "services_description: one flowing sentence listing the concrete services for THIS trip (planning, reservations, transfers, on-trip support as appropriate).",
        "cancellation_terms: a tiered refund schedule consistent with the deposit amount given; plain language.",
        "traveler_duties: one sentence of comma-separated obligations.",
        "insurance_recommendation and liability_limit: one short sentence each.",
      ].join(" ");
      const user = [
        tripTitle ? `Trip: ${tripTitle}` : "",
        destination ? `Destination: ${destination}` : "",
        dates ? `Dates: ${dates}` : "",
        travelerName ? `Traveler: ${travelerName}` : "",
        agency ? `Agency: ${agency}` : "",
        totalCost ? `Total cost: $${totalCost.toLocaleString()}` : "",
        depositAmount ? `Deposit: $${depositAmount.toLocaleString()}` : "",
        "",
        "Draft the six clauses now.",
      ].filter((l) => l !== "").join("\n");
      const out = await callOpenAI(system, user, 700);
      const clean = (v: unknown, max = 900) => String(v ?? "").slice(0, max).trim();
      return jsonResponse(req, {
        services_description: clean(out.services_description),
        cancellation_terms: clean(out.cancellation_terms),
        modification_policy: clean(out.modification_policy),
        traveler_duties: clean(out.traveler_duties),
        insurance_recommendation: clean(out.insurance_recommendation, 300),
        liability_limit: clean(out.liability_limit, 300),
      });
    }

    // ── MODE: field_polish — rewrite any application/profile field ──
    if (mode === "field_polish") {
      const text = String(body.text ?? "").slice(0, 2000).trim();
      const fieldLabel = String(body.field_label ?? "this field").slice(0, 80);
      const persona = String(body.persona ?? "a Goldsainte applicant").slice(0, 120);
      if (text.length < 10) {
        return jsonResponse(
          req,
          { error: "Write a rough draft first (at least 10 characters)." },
          400,
        );
      }
      const system = [
        "You are the in-house editor for Goldsainte, a luxury travel marketplace.",
        VOICE,
        `You are rewriting the "${fieldLabel}" field of an application written by ${persona}.`,
        "Keep every fact the writer gave — never invent credentials, numbers, clients, or experience they didn't claim.",
        "First person, warm and confident, plain language over jargon. 40–120 words, proportional to the input.",
        'Output strict JSON: { "text": string }.',
      ].join(" ");
      const out = await callOpenAI(system, `Their draft:\n${text}\n\nRewrite it now.`, 300);
      const polished = String(out.text ?? "").slice(0, 1500).trim();
      if (!polished) {
        return jsonResponse(req, { error: "Rewrite came back empty — try again." }, 502);
      }
      return jsonResponse(req, { text: polished });
    }

    return jsonResponse(req, { error: "unknown mode" }, 400);
  } catch (e) {
    console.error("ai-proposal-polish error", e);
    return jsonResponse(req, { error: String((e as Error)?.message ?? e) }, 500);
  }
});
