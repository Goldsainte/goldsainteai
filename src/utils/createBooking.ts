// src/utils/createBooking.ts
import { supabase } from "@/integrations/supabase/client";

/**
 * Creates a booking from a trip_request + proposal.
 * This assumes:
 * - proposal.status is already 'accepted'
 * - caller has already checked that the current user is the traveler
 */
export async function createBookingFromProposal(args: {
  tripRequestId: string;
  proposalId: string;
  totalPriceCents: number;
  platformCommissionCents: number;
}) {
  const { tripRequestId, proposalId, totalPriceCents, platformCommissionCents } =
    args;

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("User must be signed in to create a booking.");
  }

  const { data: proposal, error: proposalError } = await supabase
    .from("trip_proposals")
    .select("id, proposer_id, proposer_role, trip_request_id, status")
    .eq("id", proposalId)
    .maybeSingle();

  if (proposalError || !proposal) {
    throw new Error("Proposal not found.");
  }

  if (proposal.trip_request_id !== tripRequestId) {
    throw new Error("Proposal does not belong to this trip.");
  }

  if (proposal.status !== "accepted" && proposal.status !== "booked") {
    throw new Error("Proposal must be accepted before creating a booking.");
  }

  const partnerPayoutCents = totalPriceCents - platformCommissionCents;

  const { data: trip, error: tripError } = await supabase
    .from("trip_requests")
    .select("id, user_id")
    .eq("id", tripRequestId)
    .maybeSingle();

  if (tripError || !trip) {
    throw new Error("Trip request not found.");
  }

  if (trip.user_id !== user.id) {
    throw new Error("Only the traveler can create a booking for this trip.");
  }

  // Create trip booking row
  const { data: booking, error: bookingError } = await supabase
    .from("trip_bookings")
    .insert({
      trip_request_id: tripRequestId,
      proposal_id: proposalId,
      traveler_id: trip.user_id,
      partner_id: proposal.proposer_id,
      partner_role: proposal.proposer_role,
      currency: "USD",
      total_price: totalPriceCents,
      platform_commission: platformCommissionCents,
      partner_payout: partnerPayoutCents,
      status: "pending",
    })
    .select("*")
    .maybeSingle();

  if (bookingError || !booking) {
    console.error("Error creating booking:", bookingError);
    throw new Error("Could not create booking.");
  }

  // Update trip + proposal for backwards compatibility
  await supabase
    .from("trip_requests")
    .update({
      status: "booked",
      booked_at: new Date().toISOString(),
      selected_proposal_id: proposalId,
    })
    .eq("id", tripRequestId);

  await supabase
    .from("trip_proposals")
    .update({ status: "booked" })
    .eq("id", proposalId);

  return booking;
}
