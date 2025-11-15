// src/services/bookingService.ts
import { supabase } from "@/integrations/supabase/client";

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
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("You must be signed in.");

  // Load proposal
  const { data: proposal, error: proposalError } = await supabase
    .from("trip_proposals")
    .select("id, trip_request_id, proposer_id, proposer_role, price_from")
    .eq("id", params.proposalId)
    .maybeSingle();

  if (proposalError || !proposal) {
    throw new Error("Proposal not found.");
  }

  // Load trip to confirm traveler
  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("id, traveler_id")
    .eq("id", params.tripId)
    .maybeSingle();

  if (tripError || !trip) {
    throw new Error("Trip not found.");
  }

  if (trip.traveler_id !== user.id) {
    throw new Error("You can only book trips you created.");
  }

  const total = proposal.price_from ?? 0;
  // Simple fee structure: 15% platform, 85% to partners
  const platformFee = total * 0.15;
  const partnerShare = total - platformFee;

  const agentId = proposal.proposer_role === "agent"
    ? proposal.proposer_id
    : null;
  const creatorId = proposal.proposer_role === "creator"
    ? proposal.proposer_id
    : null;

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      trip_id: trip.id,
      traveler_id: trip.traveler_id,
      agent_id: agentId,
      creator_id: creatorId,
      proposal_id: proposal.id,
      status: "awaiting_payment",
      total_amount: total,
      platform_fee: platformFee,
      agent_share: agentId ? partnerShare : null,
      creator_share: creatorId ? partnerShare : null,
    })
    .select("*")
    .single();

  if (bookingError || !booking) {
    console.error(bookingError);
    throw new Error("Could not create booking.");
  }

  // Also mark proposal accepted, others declined.
  await supabase
    .from("trip_proposals")
    .update({ status: "accepted" })
    .eq("id", proposal.id);

  await supabase
    .from("trip_proposals")
    .update({ status: "declined" })
    .eq("trip_request_id", proposal.trip_request_id)
    .neq("id", proposal.id);

  // Mark trip as matched
  await supabase
    .from("trips")
    .update({ status: "booked" })
    .eq("id", trip.id);

  return booking;
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
