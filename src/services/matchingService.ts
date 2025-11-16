// src/services/matchingService.ts

export type TripRequest = {
  id: string;
  destination?: string | null;
  budget_level?: string | null;
  travel_styles?: string[] | null;
  occasion?: string | null;
  wants_role?: "creator" | "agent" | "both" | null;
};

export type CreatorProfile = {
  id: string;
  display_name: string;
  tiktok_handle?: string | null;
  creator_niches?: string[] | null;
  creator_budget_levels?: string[] | null;
};

export type CreatorMatch = {
  creator: CreatorProfile;
  score: number;
  reasons: string[];
};

export function computeCreatorMatchScore(
  trip: TripRequest,
  creator: CreatorProfile
): CreatorMatch {
  let score = 0;
  const reasons: string[] = [];

  const niches = creator.creator_niches || [];
  const budgets = creator.creator_budget_levels || [];
  const tripStyles = trip.travel_styles || [];

  // Travel style overlap
  const styleOverlap = tripStyles.filter((s) => niches.includes(s));
  if (styleOverlap.length > 0) {
    score += styleOverlap.length * 10;
    reasons.push(`Shares your trip style: ${styleOverlap.join(", ")}`);
  }

  // Budget alignment
  if (trip.budget_level && budgets.includes(trip.budget_level)) {
    score += 15;
    reasons.push(`Comfortable with your budget level (${trip.budget_level})`);
  }

  // Occasion hacks (later you can map more precisely)
  if (trip.occasion && niches.includes("Romantic") && /honeymoon|anniversary/i.test(trip.occasion)) {
    score += 10;
    reasons.push("Specializes in romantic / celebration trips");
  }

  // Destination fuzzy match (v1: simple substring)
  if (trip.destination && niches.some((n) => n.includes(trip.destination!))) {
    score += 10;
    reasons.push(`Has content around ${trip.destination}`);
  }

  return { creator, score, reasons };
}

export async function getTopCreatorsForTrip(
  trip: TripRequest,
  allCreators: CreatorProfile[],
  maxResults = 5
): Promise<CreatorMatch[]> {
  const scored = allCreators.map((c) => computeCreatorMatchScore(trip, c));
  return scored
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}
