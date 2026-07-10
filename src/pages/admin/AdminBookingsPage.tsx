// src/pages/admin/AdminBookingsPage.tsx
// Rewired Jul 10 from the empty legacy `bookings` table to `trip_bookings`,
// the table the live payment system (checkout, escrow, Release) actually
// writes. Amounts in trip_bookings are stored in DOLLARS.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BookingRow {
  id: string;
  traveler: string;
  partner: string;
  partnerRole: string;
  totalPrice: number | null;
  currency: string | null;
  platformCommission: number | null;
  partnerPayout: number | null;
  status: string;
  payoutPaidAt: string | null;
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
          .from("trip_bookings")
          .select(
            "id, traveler_id, partner_id, partner_role, total_price, currency, platform_commission, partner_payout, status, payout_paid_at, created_at"
          )
          .order("created_at", { ascending: false })
          .limit(50);

        if (bookingsError) throw bookingsError;

        const profileIds = new Set<string>();
        (data || []).forEach((row) => {
          if (row.traveler_id) profileIds.add(row.traveler_id);
          if (row.partner_id) profileIds.add(row.partner_id);
        });

        let profileMap = new Map<string, string>();
        if (profileIds.size) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name, username")
            .in("id", Array.from(profileIds));

          profileMap = new Map(
            (profiles || []).map((p) => [p.id, p.full_name || p.username || ""])
          );
        }

        if (cancelled) return;

        setBookings(
          (data || []).map((row) => ({
            id: row.id,
            traveler: profileMap.get(row.traveler_id || "") || "Guest",
            partner: row.partner_id ? profileMap.get(row.partner_id) || "Partner" : "—",
            partnerRole: row.partner_role || "—",
            totalPrice: row.total_price,
            currency: row.currency,
            platformCommission: row.platform_commission,
            partnerPayout: row.partner_payout,
            status: row.status,
            payoutPaidAt: row.payout_paid_at,
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
      <section className="mx-auto max-w-6xl">
        <p className="text-[10px] uppercase tracking-[0.28em] text-[#8D6B2F]">Commerce</p>
        <h1 className="mt-2 font-secondary text-[28px] leading-tight md:text-[30px]">
          Bookings &amp; commissions
        </h1>
        <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[#0a2225]/55">
          How each trip translates into platform revenue and partner payouts — read live
          from the payment system.
        </p>
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      </section>

      <section className="mx-auto max-w-6xl mt-8">
        {loading ? (
          <p className="text-sm text-[#4a4a4a]">Loading bookings…</p>
        ) : bookings.length === 0 ? (
          <p className="text-sm text-[#4a4a4a]">No bookings found.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl bg-white shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-[12px] text-[#4a4a4a] uppercase tracking-[0.12em]">
                  <th className="px-4 py-3">Booking</th>
                  <th className="px-4 py-3">Partner</th>
                  <th className="px-4 py-3">Totals</th>
                  <th className="px-4 py-3">Payout</th>
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
                        Platform fee: {formatMoney(booking.platformCommission, booking.currency)}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-[12px] text-[#4a4a4a]">
                      <p className="font-semibold text-[#0a2225]">{booking.partner}</p>
                      <p className="capitalize">{booking.partnerRole}</p>
                    </td>
                    <td className="px-4 py-4 text-[12px] text-[#4a4a4a]">
                      <p>
                        Total:{" "}
                        <span className="font-semibold">
                          {formatMoney(booking.totalPrice, booking.currency)}
                        </span>
                      </p>
                      <p>Partner payout: {formatMoney(booking.partnerPayout, booking.currency)}</p>
                    </td>
                    <td className="px-4 py-4 text-[12px] text-[#4a4a4a]">
                      {booking.payoutPaidAt ? (
                        <span className="inline-flex rounded-full border border-[#0c4d47]/25 bg-[#0c4d47]/10 px-3 py-1 text-[11.5px] font-medium text-[#0c4d47]">
                          Released {new Date(booking.payoutPaidAt).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full border border-[#E5DFC6] bg-[#fdfaf2] px-3 py-1 text-[11.5px] text-[#0a2225]/60">
                          In escrow
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-[12px] text-[#4a4a4a]">
                      <span className="rounded-full bg-[#E5DFC6] px-3 py-1 font-semibold text-[#0a2225] capitalize">
                        {booking.status.replace(/_/g, " ")}
                      </span>
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

// trip_bookings amounts are stored in DOLLARS — no cents conversion.
function formatMoney(value: number | null, currency: string | null) {
  if (value == null) return "—";
  const cur = (currency || "USD").toUpperCase();
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: cur,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${cur} ${value.toFixed(2)}`;
  }
}
