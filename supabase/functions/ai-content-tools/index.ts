import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";
import { checkRateLimit, createRateLimitResponse } from "../_shared/rateLimiter.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
};
}

type Tool = "caption" | "hashtags" | "rewrite" | "guide" | "creator_summary";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";
const MODEL = "gpt-4o-mini";

function jsonResponse(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

async function callOpenAI(system: string, user: string, expectJson = true): Promise<any> {
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.85,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      ...(expectJson ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`OpenAI ${resp.status}: ${text}`);
  }
  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content || "";
  return expectJson ? JSON.parse(content) : content;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });
  if (!OPENAI_API_KEY) return jsonResponse(req, { error: "OPENAI_API_KEY not configured" }, 500);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return jsonResponse(req, { error: "Unauthorized" }, 401);
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claims, error: ce } = await supabase.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (ce || !claims?.claims) return jsonResponse(req, { error: "Unauthorized" }, 401);

    // Rate limit: 30 calls per user per hour
    const userId = (claims.claims as any).sub as string;
    const rl = await checkRateLimit({
      identifier: `user:${userId}`,
      endpoint: "ai-content-tools",
      maxRequests: 30,
      windowMs: 60 * 60 * 1000,
    });
    if (!rl.allowed) return createRateLimitResponse(rl, corsHeaders(req));

    const body = await req.json();
    const tool: Tool = body.tool;

    if (tool === "caption") {
      const { title, destination, vibe = "Inspirational", platform = "Instagram" } = body;
      const system =
        "You write short, scroll-stopping social captions for a luxury travel marketplace. Output strict JSON: { captions: string[] } with exactly 3 captions.";
      const user = `Trip: "${title}" — ${destination}\nPlatform: ${platform}\nVibe: ${vibe}\nWrite 3 caption variations. Keep under ${
        platform === "Twitter" ? "260 chars" : "220 chars"
      }. Include 1-2 emojis if it fits the vibe. No hashtags.`;
      const out = await callOpenAI(system, user);
      return jsonResponse(req, out);
    }

    if (tool === "hashtags") {
      const { destination, tripType = "" } = body;
      const system =
        'You suggest hashtags for travel content. Output strict JSON: { broad: string[], medium: string[], niche: string[] } each with exactly 5 hashtags. Hashtags must include the # prefix and be lowercase, no spaces.';
      const user = `Destination: ${destination}\nTrip type: ${tripType}\nReturn 15 total hashtags grouped by reach (broad = >5M posts, medium = 100k-5M, niche = <100k).`;
      const out = await callOpenAI(system, user);
      return jsonResponse(req, out);
    }

    if (tool === "rewrite") {
      const { description, tone = "luxurious editorial" } = body;
      const system =
        "You rewrite travel product descriptions while preserving facts. Output strict JSON: { versions: string[] } with exactly 3 distinct rewrites.";
      const user = `Original description:\n"""${description}"""\n\nRewrite this in a "${tone}" tone. Each version 2-4 sentences. Keep all factual claims unchanged.`;
      const out = await callOpenAI(system, user);
      return jsonResponse(req, out);
    }

    // INPUT-WITHOUT-OUTPUT FIX (Jul 25): the guides page and creator settings
    // have been sending tool:"guide" and tool:"creator_summary" since launch
    // prep, but neither handler existed — every call 400'd as "unknown tool"
    // and surfaced as "Edge Function returned a non-2xx status code".

    if (tool === "guide") {
      const { destination = "", days = "", notes = "", voice = "" } = body;
      if (!String(destination).trim()) {
        return jsonResponse(req, { error: "destination is required" }, 400);
      }
      const dayCount = Math.min(Math.max(parseInt(String(days), 10) || 5, 1), 21);
      const system =
        'You write premium destination travel guides for a luxury travel marketplace. Output strict JSON: { "title": string, "statement": string, "tags": string[], "body": string, "hotels": [{ "name": string, "description": string, "perks": string[] }] }. "title" is a compelling guide title. "statement" is a 2-3 sentence curator\'s statement in first person. "tags" is 3-6 short lowercase topical tags (no # prefix). "body" is the full guide in markdown with a short intro then a "## Day N" section per day, each with concrete named places and practical tips. "hotels" is 2-3 real, well-known properties in the destination with a one-sentence description and 2-3 realistic perks each. Never invent prices.';
      const user = `Destination: ${destination}\nDays: ${dayCount}\nMust include: ${notes || "(author's choice)"}\n${
        voice ? `Author's voice/travel style to write in: ${voice}` : "Voice: confident, warm, editorial."
      }\nWrite the complete guide.`;
      const out = await callOpenAI(system, user);
      return jsonResponse(req, out);
    }

    if (tool === "creator_summary") {
      const { name = "This creator", bio = "", travelStyle = "", niches = [], regions = [], countries = 0, guides = [] } = body;
      const guideLines = (Array.isArray(guides) ? guides : [])
        .slice(0, 12)
        .map((g: any) => `- ${g?.title ?? "Untitled"}${Array.isArray(g?.tags) && g.tags.length ? ` (${g.tags.join(", ")})` : ""}`)
        .join("\n");
      const system =
        'You write short professional profile summaries for travel creators on a luxury travel marketplace. Output strict JSON: { "summary": string }. The summary is 2-3 sentences, third person, warm and credible, grounded ONLY in the supplied facts — never invent achievements, follower counts, or destinations not provided.';
      const user = `Creator: ${name}\nBio: ${bio || "(none)"}\nTravel style: ${travelStyle || "(none)"}\nNiches: ${
        (Array.isArray(niches) ? niches : []).join(", ") || "(none)"
      }\nRegions: ${(Array.isArray(regions) ? regions : []).join(", ") || "(none)"}\nCountries visited: ${countries}\nPublished guides:\n${guideLines || "(none yet)"}\nWrite the profile summary.`;
      const out = await callOpenAI(system, user);
      return jsonResponse(req, out);
    }

    return jsonResponse(req, { error: "unknown tool" }, 400);
  } catch (e) {
    console.error("ai-content-tools error", e);
    return jsonResponse(req, { error: String(e?.message ?? e) }, 500);
  }
});
