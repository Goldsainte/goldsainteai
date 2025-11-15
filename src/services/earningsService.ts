// src/services/earningsService.ts
import { supabase } from "@/integrations/supabase/client";

export type EarningsStatus = "pending" | "available" | "locked" | "paid";

export interface EarningsSummary {
  pending: number;
  available: number;
  locked: number;
  paid: number;
  currency: string;
}

export interface EarningsEntry {
  id: string;
  booking_id: string;
  role: "agent" | "creator" | "platform";
  amount: number;
  currency: string;
  status: EarningsStatus;
  created_at: string;
  booking?: {
    trip?: {
      title: string | null;
      destination: string | null;
    } | null;
  } | null;
}

export interface PayoutEntry {
  id: string;
  provider: string;
  provider_payout_id: string | null;
  amount: number;
  currency: string;
  status: "initiated" | "processing" | "paid" | "failed";
  created_at: string;
}

/**
 * Get earnings summary grouped by status
 */
export async function getEarningsSummary(): Promise<EarningsSummary> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("earnings_ledger")
    .select("status, amount, currency")
    .eq("user_id", user.id);

  if (error) {
    console.error(error);
    throw new Error("Could not load earnings summary");
  }

  const summary: EarningsSummary = {
    pending: 0,
    available: 0,
    locked: 0,
    paid: 0,
    currency: "USD",
  };

  (data || []).forEach((entry) => {
    if (entry.status === "pending") summary.pending += entry.amount;
    else if (entry.status === "available") summary.available += entry.amount;
    else if (entry.status === "locked") summary.locked += entry.amount;
    else if (entry.status === "paid") summary.paid += entry.amount;
  });

  return summary;
}

/**
 * Get detailed earnings ledger
 */
export async function getEarningsLedger(): Promise<EarningsEntry[]> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("earnings_ledger")
    .select(`
      *,
      booking:bookings(
        trip:trips(title, destination)
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    throw new Error("Could not load earnings ledger");
  }

  return (data || []) as EarningsEntry[];
}

/**
 * Get payout history
 */
export async function getPayoutHistory(): Promise<PayoutEntry[]> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("payouts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    throw new Error("Could not load payout history");
  }

  return (data || []) as PayoutEntry[];
}

/**
 * Create ledger entries when a booking is paid
 * (This would typically be called from an edge function/webhook)
 */
export async function createEarningsForBooking(bookingId: string) {
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .maybeSingle();

  if (bookingError || !booking) {
    throw new Error("Booking not found");
  }

  // Check if ledger entries already exist
  const { data: existing } = await supabase
    .from("earnings_ledger")
    .select("id")
    .eq("booking_id", bookingId)
    .limit(1);

  if (existing && existing.length > 0) {
    // Already created
    return;
  }

  const rows: any[] = [];

  if (booking.agent_id && booking.agent_share) {
    rows.push({
      booking_id: booking.id,
      user_id: booking.agent_id,
      role: "agent",
      amount: booking.agent_share,
      currency: booking.currency || "USD",
      status: "pending",
    });
  }

  if (booking.creator_id && booking.creator_share) {
    rows.push({
      booking_id: booking.id,
      user_id: booking.creator_id,
      role: "creator",
      amount: booking.creator_share,
      currency: booking.currency || "USD",
      status: "pending",
    });
  }

  if (rows.length > 0) {
    const { error } = await supabase.from("earnings_ledger").insert(rows);
    if (error) {
      console.error(error);
      throw new Error("Could not create earnings ledger");
    }
  }
}

/**
 * Request a payout (initiates withdrawal to connected account)
 * In production, this would call an edge function to handle Stripe Connect
 */
export async function requestPayout(amount: number, currency: string = "USD") {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  // Check available balance
  const summary = await getEarningsSummary();
  if (summary.available < amount) {
    throw new Error("Insufficient available balance");
  }

  // For now, just create a pending payout record
  // In production, you'd call an edge function that:
  // 1. Creates payout in payouts table with status='initiated'
  // 2. Updates relevant earnings_ledger rows to status='locked'
  // 3. Initiates Stripe Connect payout
  // 4. Updates payout status based on Stripe response

  const { data, error } = await supabase
    .from("payouts")
    .insert({
      user_id: user.id,
      amount,
      currency,
      provider: "stripe",
      status: "initiated",
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error(error);
    throw new Error("Could not initiate payout");
  }

  return data;
}
