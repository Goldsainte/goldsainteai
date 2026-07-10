import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DisputeRow {
  id: string;
  bookingId: string;
  raisedBy: string;
  type: string;
  status: string;
  createdAt: string;
  summary: string;
  escrowStatus: string | null;
  totalPriceCents: number | null;
  currency: string | null;
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDisputes() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: disputeError } = await supabase
          .from("disputes")
          .select("id, booking_id, raised_by, reason, status, resolution, created_at")
          .order("created_at", { ascending: false });

        if (disputeError) throw disputeError;

        const bookingIds = Array.from(new Set((data || []).map((row) => row.booking_id).filter(Boolean)));
        const userIds = Array.from(new Set((data || []).map((row) => row.raised_by).filter(Boolean)));

        const [bookingRows, profileRows] = await Promise.all([
          bookingIds.length
            ? supabase
                .from("trip_bookings")
                .select("id, status, payout_paid_at, total_price, currency")
                .in("id", bookingIds)
            : Promise.resolve({ data: [] }),
          userIds.length
            ? supabase
                .from("profiles")
                .select("id, full_name, username")
                .in("id", userIds)
            : Promise.resolve({ data: [] }),
        ]);

        const bookingMap = new Map((bookingRows.data || []).map((row: any) => [row.id, row]));
        const profileMap = new Map((profileRows.data || []).map((row: any) => [row.id, row.full_name || row.username || "User"]));

        if (cancelled) return;

        setDisputes(
          (data || []).map((row) => {
            const booking = bookingMap.get(row.booking_id) || {};
            return {
              id: row.id,
              bookingId: row.booking_id,
              raisedBy: profileMap.get(row.raised_by) || "Guest",
              type: row.reason || "dispute",
              status: row.status,
              createdAt: row.created_at,
              summary: row.resolution || "",
              escrowStatus: booking.payout_paid_at
                ? "released"
                : (booking.status ? `held · ${String(booking.status).replace(/_/g, " ")}` : null),
              // total_price is stored in dollars; keep cents internally
              totalPriceCents: booking.total_price != null ? Math.round(booking.total_price * 100) : null,
              currency: booking.currency || "USD",
            };
          })
        );
      } catch (err: any) {
        if (!cancelled) {
          console.error("Failed to load disputes", err);
          setError(err.message || "Could not load disputes");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDisputes();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleStatusUpdate = async (
    dispute: DisputeRow,
    nextStatus: "UNDER_REVIEW" | "RESOLVED" | "REJECTED"
  ) => {
    setUpdatingId(dispute.id);
    setError(null);
    try {
      const updatePayload: Record<string, any> = { status: nextStatus };
      if (nextStatus === "RESOLVED") {
        updatePayload.resolved_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from("disputes")
        .update(updatePayload)
        .eq("id", dispute.id);

      if (updateError) throw updateError;

      // Deliberately no money side-effects here: payouts release ONLY via the
      // explicit Release action on the booking (release-trip-deposit). Dispute
      // resolution changes the dispute's status, nothing else.

      setDisputes((prev) => prev.map((item) => (item.id === dispute.id ? { ...item, status: nextStatus } : item)));
    } catch (err: any) {
      console.error("Failed to update dispute", err);
      setError(err.message || "Could not update dispute");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225] px-6 py-10">
      <section className="mx-auto max-w-6xl">
        <p className="text-[10px] uppercase tracking-[0.28em] text-[#8D6B2F]">Commerce</p>
        <h1 className="mt-2 font-secondary text-[28px] leading-tight md:text-[30px]">Disputes</h1>
        <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[#0a2225]/55">
          Open and historical disputes. Resolving updates the dispute only — payouts
          release explicitly from the booking, never from this page.
        </p>
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      </section>

      <section className="mx-auto max-w-6xl mt-8">
        {loading ? (
          <p className="text-sm text-[#4a4a4a]">Loading disputes…</p>
        ) : disputes.length === 0 ? (
          <p className="text-sm text-[#4a4a4a]">No disputes recorded.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl bg-white shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-[12px] text-[#4a4a4a] uppercase tracking-[0.12em]">
                  <th className="px-4 py-3">Dispute</th>
                  <th className="px-4 py-3">Raised by</th>
                  <th className="px-4 py-3">Booking</th>
                  <th className="px-4 py-3">Escrow</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {disputes.map((dispute) => (
                  <tr key={dispute.id} className="border-t border-[#F1EBDA]">
                    <td className="px-4 py-4">
                      <p className="font-semibold">{dispute.type}</p>
                      <p className="text-[12px] text-[#4a4a4a]">{dispute.summary || "No summary"}</p>
                      <p className="text-[11px] text-[#8D8D8D]">Opened {new Date(dispute.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-4 py-4 text-[12px] text-[#4a4a4a]">{dispute.raisedBy}</td>
                    <td className="px-4 py-4 text-[12px] text-[#4a4a4a]">
                      <p className="font-semibold">Booking {dispute.bookingId.slice(0, 8)}…</p>
                      <p>Total: {formatMoney(dispute.totalPriceCents, dispute.currency)}</p>
                      <p>Status: {dispute.status}</p>
                    </td>
                    <td className="px-4 py-4 text-[12px] text-[#4a4a4a]">
                      {dispute.escrowStatus || "—"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleStatusUpdate(dispute, "UNDER_REVIEW")}
                          disabled={updatingId === dispute.id}
                          className="rounded-full border border-[#0c4d47] px-3 py-1 text-[12px] font-semibold text-[#0c4d47] hover:bg-[#0c4d47]/10"
                        >
                          Mark under review
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusUpdate(dispute, "RESOLVED")}
                          disabled={updatingId === dispute.id}
                          className="rounded-full bg-[#0c4d47] px-3 py-1 text-[12px] font-medium text-[#E5DFC6] transition-colors hover:bg-[#0a2225]"
                        >
                          Resolve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusUpdate(dispute, "REJECTED")}
                          disabled={updatingId === dispute.id}
                          className="rounded-full border border-[#0a2225]/20 px-3 py-1 text-[12px] font-medium text-[#0a2225]/60 transition-colors hover:bg-[#f7f3ea]"
                        >
                          Reject
                        </button>
                      </div>
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
