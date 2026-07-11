// src/pages/admin/AdminBookingsPage.tsx
// Rewired Jul 10 from the empty legacy `bookings` table to `trip_bookings`,
// the table the live payment system (checkout, escrow, Release) actually
// writes. Amounts in trip_bookings are stored in DOLLARS.
//
// Jul 11: became the admin release desk for the milestone escrow model.
// Two explicit money clicks per booking, both via release-trip-deposit v4:
//   Release deposit — fallback for the traveler's normal release (they act
//                     after their specialist shows confirmed reservations).
//   Release final   — fallback for the traveler's trip-complete confirmation.
// The trip_payouts ledger drives the escrow pill and prevents double release.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { confirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

interface BookingRow {
  id: string;
  traveler: string;
  partner: string;
  partnerRole: string;
  totalPrice: number | null;
  depositAmount: number | null;
  currency: string | null;
  platformCommission: number | null;
  partnerPayout: number | null;
  status: string;
  payoutPaidAt: string | null;
  depositReleased: boolean;
  releaseRequestedAt: string | null;
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadBookings() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: bookingsError } = await supabase
          .from("trip_bookings")
          .select(
            "id, traveler_id, partner_id, partner_role, total_price, deposit_amount, currency, platform_commission, partner_payout, status, payout_paid_at, created_at, metadata"
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

        // Released milestones from the ledger (best-effort — if the table
        // isn't created yet, the page still works and pills fall back).
        const bookingIds = (data || []).map((r) => r.id);
        let depositReleasedSet = new Set<string>();
        if (bookingIds.length) {
          try {
            const { data: payouts } = await supabase
              .from("trip_payouts")
              .select("trip_booking_id, milestone")
              .in("trip_booking_id", bookingIds);
            depositReleasedSet = new Set(
              (payouts || [])
                .filter((p: any) => p.milestone === "deposit")
                .map((p: any) => p.trip_booking_id)
            );
          } catch (e) {
            console.warn("trip_payouts read failed (ledger not created yet?)", e);
          }
        }

        if (cancelled) return;

        setBookings(
          (data || []).map((row) => ({
            id: row.id,
            traveler: profileMap.get(row.traveler_id || "") || "Guest",
            partner: row.partner_id ? profileMap.get(row.partner_id) || "Partner" : "—",
            partnerRole: row.partner_role || "—",
            totalPrice: row.total_price,
            depositAmount: row.deposit_amount,
            currency: row.currency,
            platformCommission: row.platform_commission,
            partnerPayout: row.partner_payout,
            status: row.status,
            payoutPaidAt: row.payout_paid_at,
            depositReleased: depositReleasedSet.has(row.id),
            releaseRequestedAt:
              ((row.metadata as any)?.release_requested_at as string) || null,
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
  }, [reloadKey]);

  async function releaseMilestone(
    booking: BookingRow,
    action: "release_deposit" | "release_final"
  ) {
    const isDeposit = action === "release_deposit";
    const amountHint = isDeposit
      ? booking.depositAmount != null
        ? formatMoney(Math.round((booking.depositAmount ?? 0) * 96.5) / 100, booking.currency)
        : "the deposit share"
      : "the remaining payout";
    const ok = await confirmDialog({
      title: isDeposit ? "Release the deposit milestone?" : "Release the final payout?",
      description: isDeposit
        ? `Sends the partner ${amountHint} as working capital. Normally the traveler releases this after seeing confirmed reservations — act only for stuck or disputed bookings. This can't be undone.`
        : `Sends the partner ${amountHint} and marks the booking completed — normally the traveler's confirmation does this. This can't be undone.`,
      confirmText: isDeposit ? "Release deposit" : "Release final",
    });
    if (!ok) return;

    setReleasingId(booking.id);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "release-trip-deposit",
        { body: { tripBookingId: booking.id, action } }
      );
      if (fnError) {
        let message = fnError.message;
        try {
          const resp = (fnError as any)?.context;
          if (resp && typeof resp.json === "function") {
            const bodyJson = await resp.json();
            if (bodyJson?.error) message = bodyJson.error;
          }
        } catch {
          /* keep original message */
        }
        throw new Error(message);
      }
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success((data as any)?.message || "Milestone released.");
      setReloadKey((k) => k + 1);
    } catch (err: any) {
      toast.error(`Release failed: ${err.message}`);
    } finally {
      setReleasingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225] px-6 py-10">
      <section className="mx-auto max-w-6xl">
        <p className="text-[10px] uppercase tracking-[0.28em] text-[#8D6B2F]">Commerce</p>
        <h1 className="mt-2 font-secondary text-[28px] leading-tight md:text-[30px]">
          Bookings &amp; commissions
        </h1>
        <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[#0a2225]/55">
          How each trip translates into platform revenue and partner payouts — read live
          from the payment system. Normally the traveler releases both milestones from
          their booking page: the deposit once their specialist shows confirmed
          reservations, the final when they confirm the trip. The buttons here are the
          fallback for stuck or disputed bookings.
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
                  <th className="px-4 py-3">Release</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => {
                  const balance =
                    Math.round(
                      ((booking.totalPrice ?? 0) - (booking.depositAmount ?? 0)) * 100
                    ) / 100;
                  const canReleaseDeposit =
                    !booking.payoutPaidAt &&
                    !booking.depositReleased &&
                    (booking.depositAmount ?? 0) > 0 &&
                    ["confirmed", "paid_in_full"].includes(booking.status);
                  const canReleaseFinal =
                    !booking.payoutPaidAt &&
                    (booking.status === "paid_in_full" ||
                      (booking.status === "confirmed" && balance <= 0));
                  const busy = releasingId === booking.id;
                  return (
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
                        <p>Deposit: {formatMoney(booking.depositAmount, booking.currency)}</p>
                        <p>Partner payout: {formatMoney(booking.partnerPayout, booking.currency)}</p>
                      </td>
                      <td className="px-4 py-4 text-[12px] text-[#4a4a4a]">
                        {booking.payoutPaidAt ? (
                          <span className="inline-flex rounded-full border border-[#0c4d47]/25 bg-[#0c4d47]/10 px-3 py-1 text-[11.5px] font-medium text-[#0c4d47]">
                            Released {new Date(booking.payoutPaidAt).toLocaleDateString()}
                          </span>
                        ) : booking.depositReleased ? (
                          <span className="inline-flex rounded-full border border-[#E5DFC6] bg-[#E5DFC6]/40 px-3 py-1 text-[11.5px] text-[#0a2225]/70">
                            Deposit released
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full border border-[#E5DFC6] bg-[#fdfaf2] px-3 py-1 text-[11.5px] text-[#0a2225]/60">
                            In escrow
                          </span>
                        )}
                        {booking.releaseRequestedAt && !booking.payoutPaidAt && (
                          <p className="mt-1.5 text-[11px] text-[#8D6B2F]">
                            Partner requested release{" "}
                            {new Date(booking.releaseRequestedAt).toLocaleDateString()}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-[12px] text-[#4a4a4a]">
                        <span className="rounded-full bg-[#E5DFC6] px-3 py-1 font-semibold text-[#0a2225] capitalize">
                          {booking.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-2">
                          {canReleaseDeposit && (
                            <button
                              onClick={() => releaseMilestone(booking, "release_deposit")}
                              disabled={busy}
                              className="whitespace-nowrap rounded-full border border-[#C7A962]/50 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-[#8D6B2F] transition-colors hover:bg-[#C7A962]/10 disabled:opacity-40"
                            >
                              {busy ? "Working…" : "Release deposit"}
                            </button>
                          )}
                          {canReleaseFinal && (
                            <button
                              onClick={() => releaseMilestone(booking, "release_final")}
                              disabled={busy}
                              className="whitespace-nowrap rounded-full bg-[#0c4d47] px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-[#E5DFC6] transition-colors hover:bg-[#0a2225] disabled:opacity-40"
                            >
                              {busy ? "Working…" : "Release final"}
                            </button>
                          )}
                          {!canReleaseDeposit && !canReleaseFinal && !booking.payoutPaidAt && (
                            <span className="text-[11px] text-[#0a2225]/40">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
