// src/services/bookingService.ts
import { supabase } from "@/integrations/supabase/client";
import {
  calculateCommissions,
  deriveCommissionMode,
} from "@/lib/booking/commission";
import { buildDefaultMilestones } from "@/lib/booking/milestones";

export type BookingStatus =
  | "pending"
  | "awaiting_payment"
  | "paid"
  | "in_progress"
  | "completed"
  | "canceled"
  | "disputed";

export async function createBookingFromProposal(params: {
  tripId: string;
  proposalId: string;
}) {
  // This function is temporarily disabled due to trip_proposals table schema mismatch
  // The trip_proposals table does not have the columns this function expects
  throw new Error(
    "Booking from proposals is temporarily disabled. Database migration required for trip_proposals table."
  );
}

export async function getMyBookings() {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("bookings")
    .select("*, trips(title, destination)")
    .eq("traveler_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    throw new Error("Could not load your bookings.");
  }
  return data ?? [];
}

export async function getMyTravelerBookingsDetailed() {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      id,
      status,
      total_amount,
      currency,
      created_at,
      trip_id,
      trips (
        title,
        destination,
        start_date,
        end_date
      ),
      trip_proposals (
        id,
        message,
        proposer_role
      )
    `)
    .eq("traveler_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    throw new Error("Could not load your bookings.");
  }

  return data ?? [];
}

