// src/services/proposalService.ts
import { supabase } from "@/integrations/supabase/client";

export type TripProposalStatus =
  | "draft"
  | "sent"
  | "traveler_review"
  | "accepted"
  | "declined"
  | "expired"
  | "withdrawn";

export type TripProposal = {
  id: string;
  trip_request_id: string;
  created_by_id: string;
  status: TripProposalStatus;
  valid_until: string | null;
  accepted_at: string | null;
  declined_at: string | null;
  withdrawn_at: string | null;
  total_price: number | null;
  currency: string | null;
};

export async function sendProposal(id: string, validForDays = 5) {
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + validForDays);

  const { error } = await supabase
    .from("trip_proposals")
    .update({
      status: "sent",
      valid_until: validUntil.toISOString(),
    })
    .eq("id", id)
    .in("status", ["draft", "withdrawn"]);

  if (error) {
    console.error("Error sending proposal", error);
    throw new Error("Could not send proposal.");
  }
}

export async function markProposalViewed(id: string) {
  // Goes through a SECURITY DEFINER database function
  // (mark_proposal_viewed) that verifies the caller owns the trip request
  // and only moves the status from 'sent'. A direct row update here would
  // require giving travelers UPDATE rights on other people's proposals —
  // far too broad.
  const { error } = await supabase.rpc("mark_proposal_viewed", {
    p_proposal_id: id,
  });

  if (error) {
    console.error("Error marking proposal viewed", error);
  }
}

export async function acceptProposal(id: string) {
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("trip_proposals")
    .update({
      status: "accepted",
      accepted_at: now,
    })
    .eq("id", id)
    .in("status", ["sent", "traveler_review"]);

  if (error) {
    console.error("Error accepting proposal", error);
    throw new Error("Could not accept proposal.");
  }
}

export async function declineProposal(id: string) {
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("trip_proposals")
    .update({
      status: "declined",
      declined_at: now,
    })
    .eq("id", id)
    .in("status", ["sent", "traveler_review"]);

  if (error) {
    console.error("Error declining proposal", error);
    throw new Error("Could not decline proposal.");
  }
}

export async function withdrawProposal(id: string) {
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("trip_proposals")
    .update({
      status: "withdrawn",
      withdrawn_at: now,
    })
    .eq("id", id)
    .in("status", ["draft", "sent", "traveler_review"]);

  if (error) {
    console.error("Error withdrawing proposal", error);
    throw new Error("Could not withdraw proposal.");
  }
}

/**
 * To be called from a scheduled job (Supabase cron / Edge function):
 * - Any proposal past valid_until in an active state becomes 'expired'.
 */
export async function expireStaleProposals() {
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("trip_proposals")
    .update({ status: "expired" })
    .lt("valid_until", now)
    .in("status", ["sent", "traveler_review"]);

  if (error) {
    console.error("Error expiring proposals", error);
    throw new Error("Could not expire proposals.");
  }
}
