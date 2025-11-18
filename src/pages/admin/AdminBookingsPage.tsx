import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { HandCoins } from "lucide-react";

interface BookingRow {
  id: string;
  traveler: string;
  creator: string;
  agent: string;
  totalPriceCents: number | null;
  currency: string | null;
  platformFeeCents: number | null;
  creatorAmountCents: number | null;
  agentAmountCents: number | null;
  commissionMode: string | null;
  status: string;
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadBookings() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: bookingsError } = await supabase
          .from("bookings")
          .select(
            "id, traveler_id, creator_id, agent_id, total_price_cents, currency, platform_fee_amount_cents, creator_commission_amount_cents, agent_commission_amount_cents, commission_mode, status"
          )
          .order("created_at", { ascending: false })
          .limit(50);

        if (bookingsError) throw bookingsError;

        const profileIds = new Set<string>();
        (data || []).forEach((row) => {
          if (row.traveler_id) profileIds.add(row.traveler_id);
          if (row.creator_id) profileIds.add(row.creator_id);
          if (row.agent_id) profileIds.add(row.agent_id);
        });

        let profileMap = new Map<string, string>();
        if (profileIds.size) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, display_name")
            .in("id", Array.from(profileIds));

          profileMap = new Map((profiles || []).map((p) => [p.id, p.display_name || ""]));
        }

        if (cancelled) return;

        setBookings(
          (data || []).map((row) => ({
            id: row.id,
            traveler: profileMap.get(row.traveler_id || "") || "Guest",
            creator: row.creator_id ? profileMap.get(row.creator_id) || "Creator" : "—",
            agent: row.agent_id ? profileMap.get(row.agent_id) || "Agent" : "—",
            totalPriceCents: row.total_price_cents,
            currency: row.currency,
            platformFeeCents: row.platform_fee_amount_cents,
            creatorAmountCents: row.creator_commission_amount_cents,
            agentAmountCents: row.agent_commission_amount_cents,
            commissionMode: row.commission_mode,
            status: row.status,
          }))
        );
      } catch (err: any) {
        if (!cancelled) {
          console.error("Failed to load bookings", err);
          setError(err.message || "Could not load bookings");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadBookings();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225] px-6 py-10">
      <section className="mx-auto max-w-6xl space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#E5DFC6] bg-white/80 px-4 py-1 text-[11px]">
          <HandCoins className="h-3 w-3 text-[#0c4d47]" />
          Bookings &amp; commissions
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-[24px] leading-tight">Track revenue and partner earnings</h1>
          <p className="text-sm max-w-3xl text-[#4a4a4a]">
            See how each trip translates into platform revenue and payouts for creators or travel agents.
          </p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </section>

      <section className="mx-auto max-w-6xl mt-8">
        {loading ? (
          <p className="text-sm text-[#4a4a4a]">Loading bookings…</p>
        ) : bookings.length === 0 ? (
          <p className="text-sm text-[#4a4a4a]">No bookings found.</p>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-[#E5DFC6] bg-white/95">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-[12px] text-[#4a4a4a] uppercase tracking-[0.12em]">
                  <th className="px-4 py-3">Booking</th>
                  <th className="px-4 py-3">Creator</th>
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Totals</th>
                  <th className="px-4 py-3">Mode</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-t border-[#F1EBDA]">
                    <td className="px-4 py-4">
                      <p className="font-semibold">{booking.id.slice(0, 8)}…</p>
                      <p className="text-[12px] text-[#4a4a4a]">Traveler: {booking.traveler}</p>
                      <p className="text-[12px] text-[#4a4a4a]">
                        Platform fee: {formatMoney(booking.platformFeeCents, booking.currency)}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-[12px] text-[#4a4a4a]">{booking.creator}</td>
                    <td className="px-4 py-4 text-[12px] text-[#4a4a4a]">{booking.agent}</td>
                    <td className="px-4 py-4 text-[12px] text-[#4a4a4a]">
                      <p>Total: <span className="font-semibold">{formatMoney(booking.totalPriceCents, booking.currency)}</span></p>
                      <p>Creator: {formatMoney(booking.creatorAmountCents, booking.currency)}</p>
                      <p>Agent: {formatMoney(booking.agentAmountCents, booking.currency)}</p>
                    </td>
                    <td className="px-4 py-4 text-[12px] text-[#4a4a4a] capitalize">
                      {booking.commissionMode || "—"}
                    </td>
                    <td className="px-4 py-4 text-[12px] text-[#4a4a4a]">
                      <span className="rounded-full bg-[#E5DFC6] px-3 py-1 font-semibold text-[#0a2225]">{booking.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function formatMoney(value: number | null, currency: string | null) {
  if (value == null) return "—";
  const cur = currency || "USD";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(value / 100);
  } catch {
    return `${cur} ${(value / 100).toFixed(0)}`;
  }
}
