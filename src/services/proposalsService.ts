// src/services/proposalsService.ts
import { supabase } from "@/integrations/supabase/client";

export type PaymentScheduleItem = {
  label: string;
  due_on: string | null;
  amount: number | null;
};

export type ProposalDetail = {
  id: string;
  status: string;
  price_from: number | null;
  currency: string | null;
  nights: number | null;
  headline: string | null;
  message: string | null;
  inclusions: string | null;
  exclusions: string | null;
  payment_schedule: PaymentScheduleItem[] | null;
  valid_until: string | null;
  created_at: string;

  trip_request: {
    id: string;
    title: string | null;
    destination: string | null;
    start_date: string | null;
    end_date: string | null;
    budget_min: number | null;
    budget_max: number | null;
  } | null;

  traveler: {
    id: string;
    display_name: string | null;
    avatar_url?: string | null;
  } | null;

  proposer: {
    id: string;
    display_name: string | null;
    role: string;
  } | null;
};

export async function getProposalDetail(
  id: string
): Promise<ProposalDetail | null> {
  const { data, error } = await supabase
    .from("trip_proposals")
    .select(
      `
      id,
      status,
      price_from,
      currency,
      nights,
      headline,
      message,
      inclusions,
      exclusions,
      payment_schedule,
      valid_until,
      created_at,
      proposer_id,
      proposer_role,
      trip_request_id
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Error loading proposal detail", error);
    throw new Error("Could not load proposal.");
  }
  if (!data) return null;

  // Fetch trip request separately
  let tripRequest = null;
  if (data.trip_request_id) {
    const { data: tr } = await supabase
      .from("trip_requests")
      .select("id, title, destination, start_date, end_date, budget_min, budget_max, user_id")
      .eq("id", data.trip_request_id)
      .maybeSingle();
    tripRequest = tr;
  }

  // Fetch traveler profile
  let traveler = null;
  if (tripRequest?.user_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .eq("id", tripRequest.user_id)
      .maybeSingle();
    traveler = profile;
  }

  // Fetch proposer profile
  let proposer = null;
  if (data.proposer_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, display_name")
      .eq("id", data.proposer_id)
      .maybeSingle();
    if (profile) {
      proposer = {
        ...profile,
        role: data.proposer_role,
      };
    }
  }

  let schedule: PaymentScheduleItem[] | null = null;
  if (data.payment_schedule) {
    try {
      schedule = Array.isArray(data.payment_schedule)
        ? data.payment_schedule
        : JSON.parse(data.payment_schedule as any);
    } catch {
      schedule = null;
    }
  }

  return {
    id: data.id,
    status: data.status,
    price_from: data.price_from,
    currency: data.currency,
    nights: data.nights,
    headline: data.headline,
    message: data.message,
    inclusions: Array.isArray(data.inclusions) ? data.inclusions.join('\n') : data.inclusions,
    exclusions: Array.isArray(data.exclusions) ? data.exclusions.join('\n') : data.exclusions,
    payment_schedule: schedule,
    valid_until: data.valid_until,
    created_at: data.created_at,
    trip_request: tripRequest ? {
      id: tripRequest.id,
      title: tripRequest.title,
      destination: tripRequest.destination,
      start_date: tripRequest.start_date,
      end_date: tripRequest.end_date,
      budget_min: tripRequest.budget_min,
      budget_max: tripRequest.budget_max,
    } : null,
    traveler,
    proposer,
  };
}

export async function acceptProposal(proposalId: string) {
  const { data, error } = await supabase.rpc("accept_proposal_rpc", {
    proposal_id_input: proposalId,
  });

  if (error) {
    console.error("Error accepting proposal", error);
    throw new Error("We couldn't accept this proposal just now.");
  }

  return data as { booking_id: string };
}

export async function declineProposal(proposalId: string) {
  const now = new Date().toISOString();
  
  const { error } = await supabase
    .from("trip_proposals")
    .update({ 
      status: "declined",
      declined_at: now,
    })
    .eq("id", proposalId);

  if (error) {
    console.error("Error declining proposal", error);
    throw new Error("We couldn't update this proposal.");
  }
}

export type ProposalListItem = {
  id: string;
  status: string;
  price_from: number | null;
  currency: string | null;
  nights: number | null;
  headline: string | null;
  created_at: string;
  valid_until: string | null;
  proposer_id: string | null;
  proposer_role: string | null;
  
  proposer: {
    id: string;
    display_name: string | null;
  } | null;
};

export async function getProposalsForTrip(
  tripRequestId: string
): Promise<ProposalListItem[]> {
  const { data, error } = await supabase
    .from("trip_proposals")
    .select(
      `
      id,
      status,
      price_from,
      currency,
      nights,
      headline,
      created_at,
      valid_until,
      proposer_id,
      proposer_role
    `
    )
    .eq("trip_request_id", tripRequestId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading proposals list", error);
    throw new Error("Could not load proposals.");
  }

  if (!data || data.length === 0) return [];

  // Fetch proposer profiles separately
  const proposerIds = [...new Set(data.map(p => p.proposer_id).filter(Boolean))] as string[];
  
  let proposerProfiles: Record<string, { id: string; display_name: string | null }> = {};
  
  if (proposerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", proposerIds);
    
    if (profiles) {
      proposerProfiles = profiles.reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {} as Record<string, { id: string; display_name: string | null }>);
    }
  }

  return data.map(p => ({
    ...p,
    proposer: p.proposer_id ? proposerProfiles[p.proposer_id] || null : null,
  }));
}
