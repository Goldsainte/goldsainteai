import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
};
}

type Tool = "caption" | "hashtags" | "rewrite";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";
const MODEL = "gpt-4o-mini";

function jsonResponse(body: unknown, status = 200) {
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
  if (!OPENAI_API_KEY) return jsonResponse({ error: "OPENAI_API_KEY not configured" }, 500);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return jsonResponse({ error: "Unauthorized" }, 401);
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claims, error: ce } = await supabase.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (ce || !claims?.claims) return jsonResponse({ error: "Unauthorized" }, 401);

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
      return jsonResponse(out);
    }

    if (tool === "hashtags") {
      const { destination, tripType = "" } = body;
      const system =
        'You suggest hashtags for travel content. Output strict JSON: { broad: string[], medium: string[], niche: string[] } each with exactly 5 hashtags. Hashtags must include the # prefix and be lowercase, no spaces.';
      const user = `Destination: ${destination}\nTrip type: ${tripType}\nReturn 15 total hashtags grouped by reach (broad = >5M posts, medium = 100k-5M, niche = <100k).`;
      const out = await callOpenAI(system, user);
      return jsonResponse(out);
    }

    if (tool === "rewrite") {
      const { description, tone = "luxurious editorial" } = body;
      const system =
        "You rewrite travel product descriptions while preserving facts. Output strict JSON: { versions: string[] } with exactly 3 distinct rewrites.";
      const user = `Original description:\n"""${description}"""\n\nRewrite this in a "${tone}" tone. Each version 2-4 sentences. Keep all factual claims unchanged.`;
      const out = await callOpenAI(system, user);
      return jsonResponse(out);
    }

    return jsonResponse({ error: "unknown tool" }, 400);
  } catch (e) {
    console.error("ai-content-tools error", e);
    return jsonResponse({ error: String(e?.message ?? e) }, 500);
  }
});