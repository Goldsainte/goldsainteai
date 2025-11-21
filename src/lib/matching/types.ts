export type TripBudgetBand =
  | "flexible-luxury"
  | "top-tier"
  | "considered"
  | "unspecified";

export type TravelerCompanions =
  | "solo"
  | "couple"
  | "friends"
  | "family-with-kids"
  | "multi-generational";

export type TripVibe =
  | "adventure-packed"
  | "balanced"
  | "relaxed-exploration"
  | "total-chill";

export type TripInterestTag =
  | "nature"
  | "urban"
  | "food"
  | "nightlife"
  | "art"
  | "wellness"
  | "sustainable"
  | "music"
  | "shopping"
  | "hidden-gems";

export interface TripRequestContext {
  id: string;
  traveler_user_id: string;
  traveler_name?: string | null;
  traveler_companions?: TravelerCompanions;
  trip_vibe?: TripVibe;
  budget_band?: TripBudgetBand;
  check_in?: string | null;
  check_out?: string | null;
  notes: string;
  tags: TripInterestTag[];
  brand: {
    id: string;
    name: string;
    location?: string | null;
    tags?: string[];
  };
  collection: {
    id: string;
    title: string;
    summary: string;
    tags?: string[];
  };
}

export interface CandidateProfile {
  user_id: string;
  role: "creator" | "agent";
  name: string;
  headline?: string;
  languages?: string[];
  home_base?: string;
  regions?: string[];
  specialties?: string[];
  brand_affinities?: string[];
  style_tags?: string[];
  embedding_vector_id?: string;
}

export interface MatchingPayload {
  trip: TripRequestContext;
  candidates: CandidateProfile[];
}
