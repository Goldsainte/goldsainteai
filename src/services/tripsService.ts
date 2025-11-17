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
  if (userError || !user) throw new Error("Not signed in");

  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
      id,
      status,
      total_amount,
      currency,
      payout_status,
      created_at,
      trips:trip_id (
        id,
        title,
        destination,
        start_date,
        end_date
      )
    `
    )
    .eq("traveler_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading trips", error);
    throw new Error("Could not load your trips.");
  }

  return (data || []).map((row: any) => ({
    booking_id: row.id,
    status: row.status,
    total_amount: row.total_amount,
    currency: row.currency,
    payout_status: row.payout_status,
    created_at: row.created_at,
    trip: row.trips ? {
      id: row.trips.id,
      title: row.trips.title,
      destination: row.trips.destination,
      starts_on: row.trips.start_date,
      ends_on: row.trips.end_date,
    } : null,
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
  if (userError || !user) throw new Error("Not signed in");

  const column = role === "creator" ? "creator_id" : "agent_id";
  const earningsColumn =
    role === "creator" ? "creator_earnings" : "agent_earnings";

  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
      id,
      status,
      total_amount,
      currency,
      payout_status,
      created_at,
      ${earningsColumn},
      trips:trip_id (
        id,
        title,
        destination,
        start_date,
        end_date
      ),
      traveler_profile:traveler_id (
        id,
        display_name
      )
    `
    )
    .eq(column, user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading partner trips", error);
    throw new Error("Could not load your trips as a partner.");
  }

  return (data || []).map((row: any) => ({
    booking_id: row.id,
    status: row.status,
    total_amount: row.total_amount,
    currency: row.currency,
    payout_status: row.payout_status,
    created_at: row.created_at,
    my_earnings:
      role === "creator" ? row.creator_earnings : row.agent_earnings,
    trip: row.trips ? {
      id: row.trips.id,
      title: row.trips.title,
      destination: row.trips.destination,
      starts_on: row.trips.start_date,
      ends_on: row.trips.end_date,
    } : null,
    traveler: row.traveler_profile || null,
  }));
}
