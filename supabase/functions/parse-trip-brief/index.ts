// parse-trip-brief (31 Jul) — the AI front door for "Get matched".
// Takes a traveler's free-text description of their trip and extracts the
// SAME structured fields the /post-trip wizard produces. Deliberately does
// NOT insert anything: it returns fields, the client inserts through the
// exact path the wizard uses, and the existing ai-trip-matching pipeline
// fires downstream unchanged. Gentle failure mode by design — any field the
// model can't extract comes back null and the trip request simply carries
// fewer filters, the same as a traveler who skipped optional questions.
// Same OpenAI pattern/env as ai-proposal-polish.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";
const MODEL = "gpt-4o-mini";

const corsHeaders = (req: Request) => ({
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
});
const json = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });

const SYSTEM_PROMPT = `You extract structured trip-request fields from a traveler's free-text description. Today's date is {TODAY}.
Respond ONLY with a JSON object — no prose, no markdown fences — with exactly these keys (use null when the text doesn't say):
{
  "title": string,            // short trip title in the traveler's spirit, e.g. "Two weeks in northern Japan"
  "destination": string|null, // place(s) as written or normalized, e.g. "Kyoto & Tokyo, Japan"
  "start_date": string|null,  // ISO date YYYY-MM-DD; resolve relative phrases ("early October") to a sensible date; null if truly unknown
  "end_date": string|null,    // ISO date; infer from duration if given ("10 days")
  "travelers_adults": number|null,
  "travelers_children": number|null,
  "budget_min": number|null,  // whole currency units
  "budget_max": number|null,
  "budget_level": string|null,   // one of: "budget","comfort","premium","luxury" if inferable
  "occasion": string|null,       // e.g. "honeymoon","anniversary","family trip"
  "pace": string|null,           // "relaxed","balanced","packed" if inferable
  "interests": string[]|null,    // short tags, e.g. ["food","hiking","photography"]
  "special_notes": string|null   // anything important that doesn't fit above, in the traveler's words
}
Never invent facts not present or reasonably implied. Dates in the past are wrong — trips are in the future.`;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });

  try {
    if (!OPENAI_API_KEY) return json(req, { error: "OPENAI_API_KEY not configured" }, 500);

    // Signed-in travelers only — same bar as the wizard (RequireAuth).
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: userData } = await admin.auth.getUser(jwt);
    if (!userData?.user) return json(req, { error: "Not authenticated" }, 401);

    const { brief } = await req.json().catch(() => ({}));
    if (typeof brief !== "string" || brief.trim().length < 15) {
      return json(req, { error: "Tell us a little more about the trip first." }, 400);
    }

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
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
          { role: "system", content: SYSTEM_PROMPT.replace("{TODAY}", new Date().toISOString().slice(0, 10)) },
          { role: "user", content: brief.slice(0, 4000) },
        ],
      }),
    });
    if (!resp.ok) {
      const t = await resp.text();
      console.error("[parse-trip-brief] OpenAI error", resp.status, t.slice(0, 300));
      return json(req, { error: "Could not read the brief — please try again." }, 502);
    }
    const data = await resp.json();
    let fields: Record<string, unknown> = {};
    try {
      fields = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
    } catch {
      console.error("[parse-trip-brief] non-JSON model output");
      return json(req, { error: "Could not read the brief — please try again." }, 502);
    }

    // Belt-and-braces: whitelist keys and basic types so the client only ever
    // receives the shape it expects, whatever the model did.
    const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
    const num = (v: unknown) => (typeof v === "number" && isFinite(v) && v >= 0 ? v : null);
    const iso = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
    const clean = {
      title: str(fields.title) ?? "My trip",
      destination: str(fields.destination),
      start_date: iso(fields.start_date),
      end_date: iso(fields.end_date),
      travelers_adults: num(fields.travelers_adults),
      travelers_children: num(fields.travelers_children),
      budget_min: num(fields.budget_min),
      budget_max: num(fields.budget_max),
      budget_level: ["budget", "comfort", "premium", "luxury"].includes(fields.budget_level as string)
        ? (fields.budget_level as string) : null,
      occasion: str(fields.occasion),
      pace: ["relaxed", "balanced", "packed"].includes(fields.pace as string)
        ? (fields.pace as string) : null,
      interests: Array.isArray(fields.interests)
        ? fields.interests.filter((x) => typeof x === "string").slice(0, 10) : null,
      special_notes: str(fields.special_notes),
    };

    return json(req, { fields: clean });
  } catch (e: any) {
    console.error("[parse-trip-brief]", e);
    return json(req, { error: e?.message || "Parse failed" }, 500);
  }
});
