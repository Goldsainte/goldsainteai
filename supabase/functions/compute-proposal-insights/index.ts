import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  "Vary": "Origin",
};
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
  },
});

interface TripProposalRecord {
  id: string;
  trip_request_id: string | null;
  proposer_id: string | null;
  proposer_role: "agent" | "creator" | null;
  price_from: number | null;
  nights: number | null;
  message: string | null;       // itinerary overview
  inclusions: string | null;    // what's included
  exclusions: string | null;    // what's not included
  headline: string | null;      // why they're a great fit
}

interface TripRequestRecord {
  id: string;
  destination: string | null;
  departure_city: string | null;
  travelers_adults: number | null;
  travelers_children: number | null;
  flexible_dates: boolean | null;
  start_date: string | null;
  end_date: string | null;
}

interface DBWebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: TripProposalRecord;
  old_record?: TripProposalRecord | null;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getDestinationTier(destination: string | null | undefined): "A" | "B" | "C" {
  if (!destination) return "B";

  const dest = destination.toLowerCase();

  const tierAKeywords = [
    "paris", "maldives", "tokyo", "new york", "nyc", "london", "dubai",
    "santorini", "capri", "amalfi", "st barth", "st. barth", "monaco", "mykonos",
  ];

  const tierCKeywords = [
    "mexico", "thailand", "bali", "lisbon", "portugal", "turkey", "vietnam", "costa rica",
  ];

  if (tierAKeywords.some((k) => dest.includes(k))) return "A";
  if (tierCKeywords.some((k) => dest.includes(k))) return "C";
  return "B";
}

function estimateNightlyHotelRate(
  destination: string | null | undefined,
  inclusions: string | null | undefined
): number {
  const tier = getDestinationTier(destination);
  const inc = (inclusions || "").toLowerCase();

  const isUltraLuxury =
    inc.includes("villa") ||
    inc.includes("ultra luxury") ||
    inc.includes("five-star") ||
    inc.includes("5-star") ||
    inc.includes("six senses") ||
    inc.includes("aman") ||
    inc.includes("rosewood") ||
    inc.includes("four seasons");

  if (tier === "A") {
    return isUltraLuxury ? 1000 : 600;
  }
  if (tier === "B") {
    return isUltraLuxury ? 700 : 400;
  }
  return isUltraLuxury ? 400 : 250;
}

function estimateFlightCost(
  inclusions: string | null | undefined,
  trip: TripRequestRecord | null,
  travelerCount: number
): number {
  const inc = (inclusions || "").toLowerCase();
  const includesFlights =
    inc.includes("flight") ||
    inc.includes("flights") ||
    inc.includes("airfare") ||
    inc.includes("air fare");

  if (!includesFlights) return 0;

  const tier = getDestinationTier(trip?.destination || null);
  let perPerson = 800;

  if (tier === "A") perPerson = 1200;
  if (tier === "C") perPerson = 600;

  return perPerson * travelerCount;
}

function estimateActivityCost(
  itinerary: string | null | undefined,
  inclusions: string | null | undefined
): number {
  const text = `${itinerary || ""}\n${inclusions || ""}`.toLowerCase();

  let cost = 0;

  if (text.includes("yacht")) cost += 2000;
  if (text.includes("boat") || text.includes("sailing")) cost += 800;
  if (text.includes("wine") || text.includes("vineyard")) cost += 400;
  if (text.includes("private guide") || text.includes("private tour")) cost += 600;
  if (text.includes("spa")) cost += 300;
  if (text.includes("helicopter")) cost += 2500;
  if (text.includes("cooking class") || text.includes("culinary")) cost += 300;
  if (text.includes("vip")) cost += 500;

  if (!cost && text.includes("activities")) {
    cost = 500;
  }

  return cost;
}

function estimateTransferCost(inclusions: string | null | undefined): number {
  const inc = (inclusions || "").toLowerCase();

  const includesPrivateTransfers =
    inc.includes("private transfer") ||
    inc.includes("chauffeur") ||
    inc.includes("driver") ||
    inc.includes("car with driver");

  const includesTransfers = includesPrivateTransfers || inc.includes("transfer");

  if (!includesTransfers) return 0;

  if (includesPrivateTransfers) return 350;
  return 200;
}

function estimateConciergeLaborCost(nights: number): number {
  const perNight = 25;
  return nights * perNight;
}

function estimateTravelerCount(trip: TripRequestRecord | null): number {
  const adults = trip?.travelers_adults ?? 2;
  const children = trip?.travelers_children ?? 0;
  const total = adults + children;
  return total > 0 ? total : 2;
}

function computeCostBasis(
  proposal: TripProposalRecord,
  trip: TripRequestRecord | null
): number {
  const nights =
    proposal.nights ??
    (() => {
      if (trip?.start_date && trip?.end_date) {
        const start = new Date(trip.start_date);
        const end = new Date(trip.end_date);
        const diffMs = end.getTime() - start.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 7;
      }
      return 7;
    })();

  const travelerCount = estimateTravelerCount(trip);
  const nightlyRate = estimateNightlyHotelRate(trip?.destination, proposal.inclusions);
  const hotelCost = nightlyRate * nights * Math.max(1, Math.ceil(travelerCount / 2));

  const flightCost = estimateFlightCost(proposal.inclusions, trip, travelerCount);
  const activityCost = estimateActivityCost(proposal.message, proposal.inclusions);
  const transferCost = estimateTransferCost(proposal.inclusions);
  const conciergeCost = estimateConciergeLaborCost(nights);

  const costBasis =
    hotelCost + flightCost + activityCost + transferCost + conciergeCost;

  return Math.round(costBasis);
}

function computeComplexityScore(
  proposal: TripProposalRecord,
  trip: TripRequestRecord | null
): number {
  const itinerary = (proposal.message || "").toLowerCase();
  const inclusions = (proposal.inclusions || "").toLowerCase();
  const destination = (trip?.destination || "").toLowerCase();
  const travelers = estimateTravelerCount(trip);

  const dayMatches = itinerary.match(/day\s+\d+/gi) || [];
  const citiesCount = Math.max(dayMatches.length, 1);
  const destScore = Math.min(citiesCount - 1, 4) * 2;

  let activityCount = 0;
  const activityKeywords = [
    "tour", "tasting", "yacht", "boat", "spa", "helicopter",
    "cooking class", "workshop", "hike", "excursion",
  ];
  for (const k of activityKeywords) {
    if (itinerary.includes(k) || inclusions.includes(k)) {
      activityCount++;
    }
  }
  const actScore = Math.min(activityCount, 5);

  const luxurySignals = [
    "5-star", "five-star", "six senses", "four seasons", "rosewood",
    "aman", "villa", "butler", "ultra luxury",
  ];
  let luxuryScore = 0;
  for (const k of luxurySignals) {
    if (itinerary.includes(k) || inclusions.includes(k) || destination.includes(k)) {
      luxuryScore = 2;
      break;
    }
  }

  const travelerScore = clamp(Math.round(travelers / 2), 1, 4);

  const flexible = !!trip?.flexible_dates;
  const flexibilityAdjust = flexible ? -1 : 0;

  const rawScore = destScore + actScore + luxuryScore + travelerScore + flexibilityAdjust;
  return clamp(Math.round(rawScore), 1, 10);
}

function generateSupplierNotes(
  proposal: TripProposalRecord,
  trip: TripRequestRecord | null,
  costBasis: number,
  marginAmount: number,
  marginPercent: number,
  complexityScore: number
): string {
  const destination = trip?.destination || "the destination";
  const inclusions = (proposal.inclusions || "").toLowerCase();

  const suppliers: string[] = [];
  const notes: string[] = [];

  const tier = getDestinationTier(destination);
  if (tier === "A") {
    suppliers.push(
      "Consider ultra-luxury hotel partners (Aman, Six Senses, Rosewood, Four Seasons) where available."
    );
  } else if (tier === "B") {
    suppliers.push(
      "Consider upscale boutique partners and design-led properties with strong reviews."
    );
  } else {
    suppliers.push(
      "Focus on high-value 4–5 star options with strong service ratings and flexible cancellation."
    );
  }

  if (inclusions.includes("transfer") || inclusions.includes("driver")) {
    suppliers.push("Use reputable private transfer providers or DMC ground partners.");
  }

  if (inclusions.includes("yacht") || inclusions.includes("boat")) {
    suppliers.push("Use vetted yacht / boat operators with appropriate insurance and crew.");
  }
  if (inclusions.includes("wine") || inclusions.includes("vineyard")) {
    suppliers.push("Coordinate with established wine tour operators or cellar partners.");
  }

  if (marginPercent < 10) {
    notes.push(
      "Margin is relatively thin; review for upsell opportunities or supplier cost adjustments."
    );
  } else if (marginPercent >= 20) {
    notes.push(
      "Margin is healthy; ensure the experience quality and inclusions align with the pricing."
    );
  } else {
    notes.push("Margin is within a normal range for concierge-level itineraries.");
  }

  if (complexityScore >= 8) {
    notes.push(
      "High operational complexity; confirm supplier availability early and document contingencies."
    );
  }

  notes.push(
    "Recommend securing core inventory (hotels, key experiences, and transfers) 60–120 days in advance where possible."
  );

  return [
    `Destination: ${destination}`,
    "",
    "Recommended supplier focus:",
    ...suppliers.map((s) => `• ${s}`),
    "",
    "Operational notes:",
    ...notes.map((n) => `• ${n}`),
    "",
    `Internal economics snapshot:`,
    `• Estimated cost basis: $${costBasis.toLocaleString()}`,
    `• Estimated margin: $${marginAmount.toLocaleString()} (${marginPercent.toFixed(1)}%)`,
    `• Complexity score: ${complexityScore}/10`,
  ].join("\n");
}

async function computeInsightsForProposalId(proposalId: string) {
  console.log(`[compute-proposal-insights] Starting computation for proposal ${proposalId}`);

  const { data: proposal, error: proposalError } = await supabaseAdmin
    .from("trip_proposals")
    .select("*")
    .eq("id", proposalId)
    .single<TripProposalRecord>();

  if (proposalError || !proposal) {
    throw new Error(`Could not fetch proposal ${proposalId}: ${proposalError?.message}`);
  }

  let trip: TripRequestRecord | null = null;

  if (proposal.trip_request_id) {
    const { data: tripData, error: tripError } = await supabaseAdmin
      .from("trip_requests")
      .select("*")
      .eq("id", proposal.trip_request_id)
      .single<TripRequestRecord>();

    if (!tripError && tripData) {
      trip = tripData;
    }
  }

  const costBasis = computeCostBasis(proposal, trip);

  const price = proposal.price_from ?? costBasis * 1.25;
  const marginAmount = Math.max(price - costBasis, 0);
  const marginPercent = price > 0 ? Math.round((marginAmount / price) * 1000) / 10 : 0;

  const complexityScore = computeComplexityScore(proposal, trip);

  const supplierNotes = generateSupplierNotes(
    proposal,
    trip,
    costBasis,
    marginAmount,
    marginPercent,
    complexityScore
  );

  const { error: updateError } = await supabaseAdmin
    .from("trip_proposals")
    .update({
      admin_cost_basis: costBasis,
      admin_margin_amount: marginAmount,
      admin_margin_percent: marginPercent,
      admin_complexity_score: complexityScore,
      admin_supplier_notes: supplierNotes,
    })
    .eq("id", proposal.id);

  if (updateError) {
    throw new Error(
      `Failed to update proposal ${proposal.id} with admin insights: ${updateError.message}`
    );
  }

  console.log(`[compute-proposal-insights] ✅ Computed insights for ${proposalId}:`, {
    cost_basis: costBasis,
    margin_amount: marginAmount,
    margin_percent: marginPercent,
    complexity: complexityScore,
  });

  return {
    proposal_id: proposal.id,
    admin_cost_basis: costBasis,
    admin_margin_amount: marginAmount,
    admin_margin_percent: marginPercent,
    admin_complexity_score: complexityScore,
    admin_supplier_notes: supplierNotes,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders(req),
      status: 204
    });
  }

  try {
    const body = await req.json().catch(() => null) as
      | { proposalId?: string }
      | DBWebhookPayload
      | null;

    if (body && "proposalId" in body && body.proposalId) {
      const result = await computeInsightsForProposalId(body.proposalId);
      return new Response(JSON.stringify({ ok: true, data: result }), {
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const payload = body as DBWebhookPayload | null;

    if (
      payload &&
      payload.type === "INSERT" &&
      payload.table === "trip_proposals" &&
      payload.record?.id
    ) {
      const result = await computeInsightsForProposalId(payload.record.id);
      return new Response(JSON.stringify({ ok: true, data: result }), {
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        ok: false,
        error:
          "Invalid payload. Provide { proposalId } or a trip_proposals INSERT webhook payload.",
      }),
      {
        status: 400,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("[compute-proposal-insights] ERROR:", err);
    return new Response(
      JSON.stringify({
        ok: false,
        error: err?.message ?? "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      }
    );
  }
});
