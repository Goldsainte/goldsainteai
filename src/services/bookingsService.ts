// src/services/bookingsService.ts
import { supabase } from "@/integrations/supabase/client";

export type BookingDetail = {
  id: string;
  status: string;
  total_amount: number | null;
  currency: string | null;
  creator_earnings: number | null;
  agent_earnings: number | null;
  payout_status: string;
  payout_expected_at: string | null;
  payout_paid_at: string | null;
  created_at: string;
  deposit_paid_at?: string | null;
  paid_in_full_at?: string | null;
  completed_at?: string | null;

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

  creator: {
    id: string;
    display_name: string | null;
  } | null;

  agent: {
    id: string;
    display_name: string | null;
  } | null;

  proposal_policies?: {
    cancellation_policy_name?: string | null;
    custom_cancellation_terms?: string | null;
    deposit_percentage?: number | null;
    deposit_due_days?: number | null;
  } | null;
};

export async function getBookingDetail(
  bookingId: string
): Promise<BookingDetail | null> {
  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
      id,
      status,
      total_amount,
      currency,
      creator_earnings,
      agent_earnings,
      payout_status,
      payout_expected_at,
      payout_paid_at,
      created_at,
      trip_id,
      traveler_id,
      creator_id,
      agent_id,
      proposal_id,
      trips!inner (
        id,
        title,
        destination,
        start_date,
        end_date
      )
    `
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (error) {
    console.error("Error loading booking detail", error);
    throw new Error("Could not load booking.");
  }

  if (!data) return null;

  // Fetch related profiles
  const userIds = [data.traveler_id, data.creator_id, data.agent_id].filter(Boolean);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", userIds);

  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

  // Fetch proposal policies if proposal_id exists
  let proposalPolicies = null;
  if (data.proposal_id) {
    const { data: proposal } = await supabase
      .from("trip_proposals")
      .select(`
        custom_cancellation_terms,
        deposit_percentage,
        deposit_due_days,
        cancellation_policy_id,
        cancellation_policies (
          name
        )
      `)
      .eq("id", data.proposal_id)
      .eq("status", "accepted")
      .maybeSingle();

    if (proposal) {
      proposalPolicies = {
        cancellation_policy_name: proposal.cancellation_policies?.name || null,
        custom_cancellation_terms: proposal.custom_cancellation_terms,
        deposit_percentage: proposal.deposit_percentage,
        deposit_due_days: proposal.deposit_due_days,
      };
    }
  }

  return {
    id: data.id,
    status: data.status,
    total_amount: data.total_amount,
    currency: data.currency,
    creator_earnings: data.creator_earnings,
    agent_earnings: data.agent_earnings,
    payout_status: data.payout_status,
    payout_expected_at: data.payout_expected_at,
    payout_paid_at: data.payout_paid_at,
    created_at: data.created_at,
    trip: data.trips ? {
      id: data.trips.id,
      title: data.trips.title,
      destination: data.trips.destination,
      starts_on: data.trips.start_date,
      ends_on: data.trips.end_date,
    } : null,
    traveler: data.traveler_id ? {
      id: data.traveler_id,
      display_name: profileMap.get(data.traveler_id)?.display_name || null,
    } : null,
    creator: data.creator_id ? {
      id: data.creator_id,
      display_name: profileMap.get(data.creator_id)?.display_name || null,
    } : null,
    agent: data.agent_id ? {
      id: data.agent_id,
      display_name: profileMap.get(data.agent_id)?.display_name || null,
    } : null,
    proposal_policies: proposalPolicies,
  };
}
