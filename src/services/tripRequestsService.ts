// src/services/tripRequestsService.ts
import { supabase } from "@/integrations/supabase/client";

export type TripRequestDetail = {
  id: string;
  traveler_id: string;
  title: string | null;
  destination: string | null;
  starts_on: string | null;
  ends_on: string | null;
  budget_min: number | null;
  budget_max: number | null;
  budget_level: string | null;
  travelers_adults: number | null;
  travelers_children: number | null;
  occasion: string | null;
  accommodation_style: string | null;
  pace: string | null;
  interests: string[] | null;
  flexibility: string | null;
  special_notes: string | null;
  wants_role: string | null;
  status: string;
  created_at: string;

  traveler: {
    id: string;
    display_name: string | null;
    avatar_url?: string | null;
  } | null;

  proposals_summary: {
    total: number;
    pending: number;
    accepted: number;
  };
};

export async function getTripRequestDetail(
  id: string
): Promise<TripRequestDetail | null> {
  const { data, error } = await supabase
    .from("trip_requests")
    .select(
      `
      id,
      traveler_id,
      title,
      destination,
      starts_on,
      ends_on,
      budget_min,
      budget_max,
      budget_level,
      travelers_adults,
      travelers_children,
      occasion,
      accommodation_style,
      pace,
      interests,
      flexibility,
      special_notes,
      wants_role,
      status,
      created_at,
      traveler:traveler_id (
        id,
        display_name,
        avatar_url
      ),
      trip_proposals(*)
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Error loading trip request", error);
    throw new Error("Could not load trip request.");
  }
  if (!data) return null;

  const proposals = (data.trip_proposals || []) as any[];

  const total = proposals.length;
  const pending = proposals.filter((p) => p.status === "pending").length;
  const accepted = proposals.filter((p) => p.status === "accepted").length;

  return {
    id: data.id,
    traveler_id: data.traveler_id,
    title: data.title,
    destination: data.destination,
    starts_on: data.starts_on,
    ends_on: data.ends_on,
    budget_min: data.budget_min,
    budget_max: data.budget_max,
    budget_level: data.budget_level,
    travelers_adults: data.travelers_adults,
    travelers_children: data.travelers_children,
    occasion: data.occasion,
    accommodation_style: data.accommodation_style,
    pace: data.pace,
    interests: data.interests,
    flexibility: data.flexibility,
    special_notes: data.special_notes,
    wants_role: data.wants_role,
    status: data.status,
    created_at: data.created_at,
    traveler: data.traveler,
    proposals_summary: { total, pending, accepted },
  };
}
