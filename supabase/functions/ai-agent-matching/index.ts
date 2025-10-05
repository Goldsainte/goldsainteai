import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MatchingRequest {
  jobId: string;
  generateScores?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { jobId, generateScores = true } = await req.json() as MatchingRequest;

    // Get job details
    const { data: job, error: jobError } = await supabaseClient
      .from("marketplace_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      throw new Error("Job not found");
    }

    // Get all active and verified agents
    const { data: agents } = await supabaseClient
      .from("travel_agents")
      .select("*")
      .eq("is_active", true)
      .eq("is_verified", true);

    if (!agents || agents.length === 0) {
      return new Response(
        JSON.stringify({ matches: [], message: "No available agents" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate matching scores
    const matches = agents.map((agent) => {
      let score = 0;
      const factors: Record<string, number> = {};

      // Factor 1: Specializations match (30 points)
      if (agent.specializations && job.booking_type) {
        const hasSpecialization = agent.specializations.some((spec: string) =>
          spec.toLowerCase().includes(job.booking_type.toLowerCase()) ||
          job.booking_type.toLowerCase().includes(spec.toLowerCase())
        );
        if (hasSpecialization) {
          score += 30;
          factors.specialization_match = 30;
        }
      }

      // Factor 2: Destination match (25 points)
      if (agent.destinations && job.destination) {
        const hasDestination = agent.destinations.some((dest: string) =>
          dest.toLowerCase().includes(job.destination?.toLowerCase() || "") ||
          job.destination?.toLowerCase().includes(dest.toLowerCase())
        );
        if (hasDestination) {
          score += 25;
          factors.destination_match = 25;
        }
      }

      // Factor 3: Rating (20 points)
      const ratingScore = (agent.rating / 5) * 20;
      score += ratingScore;
      factors.rating_score = ratingScore;

      // Factor 4: Experience (15 points)
      if (agent.experience_years) {
        const expScore = Math.min((agent.experience_years / 10) * 15, 15);
        score += expScore;
        factors.experience_score = expScore;
      }

      // Factor 5: Total reviews (10 points)
      if (agent.total_reviews) {
        const reviewScore = Math.min((agent.total_reviews / 50) * 10, 10);
        score += reviewScore;
        factors.reviews_score = reviewScore;
      }

      // Determine confidence level
      let confidence: "low" | "medium" | "high" = "low";
      if (score >= 70) confidence = "high";
      else if (score >= 50) confidence = "medium";

      return {
        agent_id: agent.id,
        agent_name: agent.agency_name,
        match_score: Math.round(score),
        confidence_level: confidence,
        matching_factors: factors,
        rating: agent.rating,
        total_reviews: agent.total_reviews,
      };
    });

    // Sort by score
    matches.sort((a, b) => b.match_score - a.match_score);

    // Take top 10
    const topMatches = matches.slice(0, 10);

    // Optionally store scores in database
    if (generateScores) {
      const scoresData = topMatches.map((match) => ({
        job_id: jobId,
        agent_id: match.agent_id,
        match_score: match.match_score,
        confidence_level: match.confidence_level,
        matching_factors: match.matching_factors,
      }));

      // Delete existing scores for this job
      await supabaseClient
        .from("ai_matching_scores")
        .delete()
        .eq("job_id", jobId);

      // Insert new scores
      await supabaseClient
        .from("ai_matching_scores")
        .insert(scoresData);
    }

    return new Response(
      JSON.stringify({
        matches: topMatches,
        total_agents_evaluated: agents.length,
        job_details: {
          title: job.title,
          booking_type: job.booking_type,
          destination: job.destination,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
