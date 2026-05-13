import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import OpenAI from "https://esm.sh/openai@4.38.2";
import { enforceRateLimit } from "../_utils/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "https://goldsainte.ai",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface MatchRequestBody {
  tripRequestId: string;
  rematch?: boolean;
}

interface TripRequest {
  id: string;
  user_id: string;
  destination: string | null;
  date_range: string | null;
  travelers_count: number | null;
  budget_range: string | null;
  notes: string | null;
  collection_title: string | null;
  collection_tags: string[] | null;
}

function parseEmbedding(raw: unknown): number[] | null {
  if (!raw) return null;
  if (Array.isArray(raw)) {
    return raw.map((v) => Number(v)).filter((v) => Number.isFinite(v));
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.map((v) => Number(v)).filter((v) => Number.isFinite(v))
        : null;
    } catch {
      return null;
    }
  }
  return null;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function scoreHeuristics(trip: TripRequest, source: Record<string, any>): number {
  let score = 0;
  const destination = (trip.destination || "").toLowerCase();
  const tripTags = (trip.collection_tags || []).map((t) => t.toLowerCase());

  const regions: string[] = (source?.regions ?? source?.destinations ?? []) as string[];
  const styles: string[] = (source?.styles ?? source?.tags ?? []) as string[];

  regions.forEach((r) => {
    if (destination.includes((r || "").toLowerCase())) {
      score += 2;
    }
  });

  styles.forEach((tag) => {
    if (tripTags.includes((tag || "").toLowerCase())) {
      score += 1;
    }
  });

  return score;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { tripRequestId, rematch } = (await req.json()) as MatchRequestBody;

    if (!tripRequestId) {
      return new Response(JSON.stringify({ error: "Missing tripRequestId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const openai = new OpenAI({
      apiKey: Deno.env.get("OPENAI_API_KEY")!,
    });

    const { data: trip, error: tripError } = await supabase
      .from("trip_requests")
      .select(
        "id, user_id, destination, date_range, travelers_count, budget_range, notes, collection_title, collection_tags"
      )
      .eq("id", tripRequestId)
      .maybeSingle();

    if (tripError || !trip) throw tripError ?? new Error("Trip not found");

    const rateLimitResponse = await enforceRateLimit({
      keyType: "ai",
      userId: trip.user_id,
      req,
      corsHeaders,
    });

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { data: travelerEmbedding } = await supabase
      .from("traveler_embeddings")
      .select("embedding, source")
      .eq("user_id", trip.user_id)
      .maybeSingle();

    const { data: candidates, error: candError } = await supabase
      .from("profile_embeddings")
      .select("profile_id, role, embedding, source");

    if (candError) throw candError;

    const { data: manualPrefs } = await supabase
      .from("trip_manual_preferences")
      .select("preferred_profile_id, role")
      .eq("trip_request_id", tripRequestId);

    const manualPreferredIds = new Set(
      (manualPrefs ?? []).map((p) => p.preferred_profile_id)
    );

    const travelerVector = parseEmbedding(travelerEmbedding?.embedding ?? null);
    const scored = (candidates ?? []).map((c: any) => {
      const candidateVector = parseEmbedding(c.embedding);
      const similarity =
        travelerVector && candidateVector
          ? cosineSimilarity(travelerVector, candidateVector)
          : 0;

      const heuristic = scoreHeuristics(trip as TripRequest, c.source ?? {});
      let final = similarity + heuristic;

      if (manualPreferredIds.has(c.profile_id)) {
        final += 10;
      }

      return {
        candidate_profile_id: c.profile_id,
        role: c.role,
        similarity_score: similarity,
        heuristic_score: heuristic,
        final_score: final,
        source: c.source ?? {},
      };
    });

    if (rematch) {
      const { data: declined } = await supabase
        .from("trip_assignments")
        .select("assignee_profile_id")
        .eq("trip_request_id", tripRequestId)
        .eq("status", "declined");

      const declinedIds = new Set(
        (declined ?? []).map((d) => d.assignee_profile_id)
      );

      for (let i = scored.length - 1; i >= 0; i--) {
        if (declinedIds.has(scored[i].candidate_profile_id)) {
          scored.splice(i, 1);
        }
      }
    }

    scored.sort((a, b) => b.final_score - a.final_score);
    const top = scored.slice(0, 10);

    const explanationMessages = top.map((c) => {
      const source = c.source || {};
      return `- Candidate ${c.candidate_profile_id} (${c.role}) has style/regions: ${JSON.stringify(
        source
      )}`;
    });

    const prompt = `
You are matching a luxury trip request with ideal creators and agents.

Trip:
- Destination: ${trip.destination ?? "Flexible"}
- Dates: ${trip.date_range ?? "Flexible"}
- Travelers: ${trip.travelers_count ?? "Unknown"}
- Budget: ${trip.budget_range ?? "Not specified"}
- Collection: ${trip.collection_title ?? "N/A"}
- Tags: ${(trip.collection_tags ?? []).join(", ")}
- Traveler notes: ${trip.notes ?? "None"}

Candidates:
${explanationMessages.join("\n")}

For each candidate, produce a short, traveler-friendly explanation, no more than 2 sentences each, focusing on why their style/regions/tone is a strong fit.
Return a JSON array of:
[{ "candidate_profile_id": "uuid", "reason": "short explanation" }, ...]
`.trim();

    let explanations: any[] = [];
    if (top.length > 0) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content: "You are a matching assistant for Goldsainte.",
          },
          { role: "user", content: prompt },
        ],
      });

      try {
        const text = completion.choices[0]?.message?.content ?? "[]";
        explanations = JSON.parse(text);
      } catch {
        explanations = [];
      }
    }

    const explanationMap = new Map<string, string>();
    for (const e of explanations) {
      if (e?.candidate_profile_id && e?.reason) {
        explanationMap.set(e.candidate_profile_id, e.reason);
      }
    }

    await supabase
      .from("trip_match_candidates")
      .delete()
      .eq("trip_request_id", tripRequestId);

    const rowsToInsert = top.map((c) => ({
      trip_request_id: tripRequestId,
      candidate_profile_id: c.candidate_profile_id,
      role: c.role,
      similarity_score: c.similarity_score,
      heuristic_score: c.heuristic_score,
      final_score: c.final_score,
      explanation: explanationMap.get(c.candidate_profile_id) ?? null,
      explanation_json: { source: c.source },
    }));

    if (rowsToInsert.length > 0) {
      await supabase.from("trip_match_candidates").insert(rowsToInsert);
    }

    const topCreators = top.filter((c) => c.role === "creator").slice(0, 2);
    const topAgents = top.filter((c) => c.role === "agent").slice(0, 2);

    if (rematch) {
      await supabase
        .from("trip_assignments")
        .update({ status: "removed" })
        .eq("trip_request_id", tripRequestId)
        .eq("status", "pending");
    }

    const assignments: any[] = [];
    if (topCreators[0]) {
      assignments.push({
        trip_request_id: tripRequestId,
        assignee_profile_id: topCreators[0].candidate_profile_id,
        role: "creator",
        status: "pending",
        is_primary: true,
      });
    }
    if (topAgents[0]) {
      assignments.push({
        trip_request_id: tripRequestId,
        assignee_profile_id: topAgents[0].candidate_profile_id,
        role: "agent",
        status: "pending",
        is_primary: !topCreators[0],
      });
    }

    let insertedAssignments: any[] = [];
    if (assignments.length > 0) {
      const { data } = await supabase
        .from("trip_assignments")
        .insert(assignments)
        .select();
      insertedAssignments = data ?? [];
    }

    await supabase
      .from("trip_requests")
      .update({ status: "matched" })
      .eq("id", tripRequestId);

    if (insertedAssignments.length > 0) {
      try {
        await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-match-notifications`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({ tripRequestId }),
          }
        );
      } catch (notifyError) {
        console.error("Failed to trigger notifications", notifyError);
      }
    }

    return new Response(JSON.stringify({ ok: true, topCount: top.length }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("ai-trip-matching-embeddings error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
