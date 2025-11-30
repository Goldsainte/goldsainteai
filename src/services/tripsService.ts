// src/services/tripsService.ts
import { supabase } from "@/integrations/supabase/client";

export type TravelerTrip = {
  booking_id: string;
  status: string;
  total_amount: number | null;
  currency: string | null;
  created_at: string;
  payout_status: string;

  trip: {
    id: string;
    title: string | null;
    destination: string | null;
    starts_on: string | null;
    ends_on: string | null;
  } | null;
};

export async function getMyTrips(): Promise<TravelerTrip[]> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.warn("[tripsService] Not signed in, returning empty array");
    return [];
  }

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      id,
      status,
      total_price_cents,
      currency,
      payout_status,
      created_at,
      destination,
      start_date,
      end_date
    `)
    .eq("traveler_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[tripsService] Error loading trips:", error);
    return []; // Return empty array instead of throwing
  }

  // Map to expected shape - use booking's own fields since we removed the join
  return (data || []).map((row: any) => ({
    booking_id: row.id,
    status: row.status,
    total_amount: row.total_price_cents ? row.total_price_cents / 100 : null,
    currency: row.currency,
    payout_status: row.payout_status || "pending",
    created_at: row.created_at,
    trip: {
      id: row.id, // Use booking id as fallback
      title: null,
      destination: row.destination,
      starts_on: row.start_date,
      ends_on: row.end_date,
    },
  }));
}

export type PartnerTrip = {
  booking_id: string;
  status: string;
  total_amount: number | null;
  currency: string | null;
  created_at: string;
  payout_status: string;
  my_earnings: number | null;

  trip: {
    id: string;
    title: string | null;
    destination: string | null;
    starts_on: string | null;
    ends_on: string | null;
  } | null;

  traveler: {
    id: string;
    display_name: string | null;
  } | null;
};

export async function getMyPartnerTrips(
  role: "creator" | "agent"
): Promise<PartnerTrip[]> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.warn("[tripsService] Not signed in, returning empty array");
    return [];
  }

  const column = role === "creator" ? "creator_id" : "agent_id";
  const earningsColumn = role === "creator" ? "creator_payout_cents" : "agent_payout_cents";

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      id,
      status,
      total_price_cents,
      currency,
      payout_status,
      created_at,
      destination,
      start_date,
      end_date,
      ${earningsColumn},
      traveler:traveler_id (
        id,
        display_name
      )
    `)
    .eq(column, user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[tripsService] Error loading partner trips:", error);
    return []; // Return empty array instead of throwing
  }

  return (data || []).map((row: any) => ({
    booking_id: row.id,
    status: row.status,
    total_amount: row.total_price_cents ? row.total_price_cents / 100 : null,
    currency: row.currency,
    payout_status: row.payout_status || "pending",
    created_at: row.created_at,
    my_earnings: row[earningsColumn] ? row[earningsColumn] / 100 : null,
    trip: {
      id: row.id,
      title: null,
      destination: row.destination,
      starts_on: row.start_date,
      ends_on: row.end_date,
    },
    traveler: row.traveler || null,
  }));
}
