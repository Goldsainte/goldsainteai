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
      trip_requests:trip_request_id (
        id,
        title,
        destination,
        starts_on,
        ends_on
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
    trip: row.trip_requests || null,
  }));
}
