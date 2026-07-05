// src/services/earningsService.ts
import { supabase } from "@/integrations/supabase/client";

export type EarningsSummary = {
  currency: string;
  pending: number;
  available: number;
  locked: number;
  paid: number;
};

export interface EarningsEntry {
  id: string;
  booking_id: string;
  role: "agent" | "creator" | "platform";
  amount: number;
  currency: string;
  status: "pending" | "available" | "locked" | "paid";
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

export interface PartnerEarningBooking {
  id: string;
  status: string;
  payout_status: string | null;
  payout_paid_at: string | null;
  currency: string | null;
  created_at: string;
  amount_cents: number;
}

export interface PartnerEarningSnapshot {
  currency: string;
  pending: number;
  released: number;
  bookings: PartnerEarningBooking[];
}

export async function getMyEarningsSummary(): Promise<EarningsSummary> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("earnings_ledger")
    .select("amount, currency, status")
    .eq("user_id", user.id);

  if (error) {
    console.error(error);
    throw new Error("Could not load earnings.");
  }

  let pending = 0;
  let available = 0;
  let locked = 0;
  let paid = 0;
  let currency = "USD";

  (data || []).forEach((row) => {
    currency = row.currency || currency;
    switch (row.status) {
      case "pending":
        pending += Number(row.amount || 0);
        break;
      case "available":
        available += Number(row.amount || 0);
        break;
      case "locked":
        locked += Number(row.amount || 0);
        break;
      case "paid":
        paid += Number(row.amount || 0);
        break;
    }
  });

  return { currency, pending, available, locked, paid };
}

export async function getMyLatestEarnings(limit = 20) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("earnings_ledger")
    .select("*, bookings(total_amount, status, trip_id)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error(error);
    throw new Error("Could not load earnings history.");
  }

  return data ?? [];
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
      amount: booking.agent_earnings ?? booking.agent_share,
      currency: booking.currency || "USD",
      status: "pending",
    });
  }

  if (booking.creator_id && booking.creator_share) {
    rows.push({
      booking_id: booking.id,
      user_id: booking.creator_id,
      role: "creator",
      amount: booking.creator_earnings ?? booking.creator_share,
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

export async function requestPayout() {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  // 1. Load available earnings
  const { data: availableRows, error: availableError } = await supabase
    .from("earnings_ledger")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "available");

  if (availableError) {
    console.error(availableError);
    throw new Error("Could not load available earnings.");
  }

  if (!availableRows || availableRows.length === 0) {
    throw new Error("No available balance to pay out.");
  }

  const total = availableRows.reduce(
    (sum, row) => sum + Number(row.amount || 0),
    0,
  );
  const currency = availableRows[0].currency || "USD";

  // 2. Create payout record
  const { data: payout, error: payoutError } = await supabase
    .from("payouts")
    .insert({
      user_id: user.id,
      amount: total,
      currency,
      status: "initiated",
    })
    .select("*")
    .single();

  if (payoutError || !payout) {
    console.error(payoutError);
    throw new Error("Could not create payout.");
  }

  // 3. Lock earnings & attach payout_id
  const ids = availableRows.map((row) => row.id);

  const { error: lockError } = await supabase
    .from("earnings_ledger")
    .update({ status: "locked", payout_id: payout.id })
    .in("id", ids);

  if (lockError) {
    console.error(lockError);
    throw new Error("Could not lock earnings for payout.");
  }

  // Later: Edge Function will move payout.status to 'paid' and ledger status to 'paid'
  return payout;
}

export async function getPartnerBookingEarnings(role: "creator" | "agent"): Promise<PartnerEarningSnapshot> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  // Reads from earnings_ledger — the table your Stripe webhook actually writes
  // to on payment confirmation. The embedded bookings(status) join requires a
  // booking_id → bookings FK that the live database is currently missing
  // (generated types show only the payout_id relationship), which makes the
  // embed fail with a "could not find relationship" error. Until the FK is
  // added via SQL, fall back to the same query without the embed — the
  // booking status column degrades to "unknown" but earnings still load.
  let data: any[] | null = null;
  let usedEmbed = true;
  {
    const res = await supabase
      .from("earnings_ledger")
      .select("id, booking_id, amount, currency, status, created_at, updated_at, bookings(status)")
      .eq("user_id", user.id)
      .eq("role", role)
      .order("created_at", { ascending: false });
    if (res.error) {
      console.warn("earnings_ledger embed failed, retrying without join:", res.error.message);
      usedEmbed = false;
      const plain = await supabase
        .from("earnings_ledger")
        .select("id, booking_id, amount, currency, status, created_at, updated_at")
        .eq("user_id", user.id)
        .eq("role", role)
        .order("created_at", { ascending: false });
      if (plain.error) {
        console.error(plain.error);
        throw new Error("Could not load partner earnings");
      }
      data = plain.data;
    } else {
      data = res.data;
    }
  }

  const bookings: PartnerEarningBooking[] = (data || []).map((row: any) => ({
    id: row.booking_id,
    status: (usedEmbed ? row.bookings?.status : null) || "unknown",
    payout_status: row.status,
    payout_paid_at: row.status === "paid" ? row.updated_at : null,
    currency: row.currency,
    created_at: row.created_at,
    amount_cents: Math.round(Number(row.amount || 0) * 100),
  }));

  let pending = 0;
  let released = 0;

  bookings.forEach((booking) => {
    if (booking.payout_status === "paid") {
      released += booking.amount_cents;
    } else {
      pending += booking.amount_cents;
    }
  });

  return {
    currency: bookings[0]?.currency || "USD",
    pending,
    released,
    bookings,
  };
}
