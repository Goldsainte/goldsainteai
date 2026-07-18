// src/services/proposalsService.ts
import { supabase } from "@/integrations/supabase/client";

export type PaymentScheduleItem = {
  label: string;
  due_on: string | null;
  amount: number | null;
};

export type PriceBreakdown = {
  service_level?: string | null;
  revision_count?: number | null;
  support_level?: string | null;
  pricing_type?: string | null;
  pricing_confirmed?: boolean | null;
  planning_fee?: number | null;
  planning_fee_refundable?: boolean | null;
  balance_due?: string | null;
  deposit_refundable?: string | null;
  cancellation_windows?: { label: string; refund_percent: number }[] | null;
  change_fee?: number | null;
  supplier_dependent?: boolean | null;
  supplier_dependent_note?: string | null;
  external_links?: { label: string; url: string }[] | null;
  handles_supplier_payments?: boolean | null;
  // Commission model fields
  commission_model?: "percentage" | "flat_fee" | "hybrid" | null;
  commission_pct?: number | null;
  commission_tiered?: boolean | null;
  commission_tiers?: { threshold: number; pct: number }[] | null;
  flat_fee_amount?: number | null;
  flat_fee_covers?: string | null;
  hybrid_flat_fee?: number | null;
  hybrid_commission_pct?: number | null;
  host_fee_pct?: number | null;
  guest_fee_pct?: number | null;
  platform_total_pct?: number | null;
  agent_commission_estimate?: number | null;
  agent_payout_estimate?: number | null;
  traveler_total_estimate?: number | null;
  guest_service_fee_estimate?: number | null;
};

export type ProposalAttachment = {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
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
  itinerary_summary: string | null;
  deposit_percentage: number | null;
  deposit_due_days: number | null;
  custom_cancellation_terms: string | null;
  price_breakdown: PriceBreakdown | null;
  attachments: ProposalAttachment[];

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
      trip_request_id,
      itinerary_summary,
      deposit_percentage,
      deposit_due_days,
      custom_cancellation_terms,
      price_breakdown
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

  let priceBreakdown: PriceBreakdown | null = null;
  if (data.price_breakdown) {
    try {
      priceBreakdown = typeof data.price_breakdown === 'string'
        ? JSON.parse(data.price_breakdown)
        : data.price_breakdown as PriceBreakdown;
    } catch {
      priceBreakdown = null;
    }
  }

  // Fetch attachments
  const { data: attachments } = await supabase
    .from("proposal_attachments")
    .select("id, file_name, file_path, file_type, file_size")
    .eq("proposal_id", id);

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
    itinerary_summary: data.itinerary_summary ?? null,
    deposit_percentage: data.deposit_percentage ?? null,
    deposit_due_days: data.deposit_due_days ?? null,
    custom_cancellation_terms: data.custom_cancellation_terms ?? null,
    price_breakdown: priceBreakdown,
    attachments: (attachments ?? []) as ProposalAttachment[],
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
    // Surface the REAL reason (RAISE messages from accept_proposal_rpc arrive
    // in error.message). A generic platitude at the money moment hides the
    // one fact needed to fix it.
    const detail =
      (error as any)?.message || (error as any)?.details || (error as any)?.hint || "";
    throw new Error(
      detail
        ? `We couldn't accept this proposal: ${detail}`
        : "We couldn't accept this proposal just now."
    );
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

export type MyProposalListItem = ProposalListItem & {
  trip_title: string | null;
  trip_destination: string | null;
  trip_start_date: string | null;
  trip_end_date: string | null;
  trip_request_id: string | null;
};

export async function getMyProposals(): Promise<MyProposalListItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("trip_proposals")
    .select("id, status, price_from, currency, nights, headline, created_at, valid_until, proposer_id, proposer_role, trip_request_id")
    .eq("proposer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading my proposals", error);
    throw new Error("Could not load your proposals.");
  }
  if (!data || data.length === 0) return [];

  // Fetch trip request details
  const tripIds = [...new Set(data.map(p => p.trip_request_id).filter(Boolean))] as string[];
  let tripMap: Record<string, { title: string | null; destination: string | null; start_date: string | null; end_date: string | null }> = {};

  if (tripIds.length > 0) {
    const { data: trips } = await supabase
      .from("trip_requests")
      .select("id, title, destination, start_date, end_date")
      .in("id", tripIds);
    if (trips) {
      tripMap = trips.reduce((acc, t) => {
        acc[t.id] = { title: t.title, destination: t.destination, start_date: t.start_date, end_date: t.end_date };
        return acc;
      }, {} as typeof tripMap);
    }
  }

  return data.map(p => {
    const trip = p.trip_request_id ? tripMap[p.trip_request_id] : null;
    return {
      ...p,
      proposer: { id: user.id, display_name: null },
      trip_title: trip?.title ?? null,
      trip_destination: trip?.destination ?? null,
      trip_start_date: trip?.start_date ?? null,
      trip_end_date: trip?.end_date ?? null,
      trip_request_id: p.trip_request_id,
    };
  });
}

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
