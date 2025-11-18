import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle } from "lucide-react";

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
          .select("id, booking_id, raised_by, type, status, summary, created_at")
          .order("created_at", { ascending: false });

        if (disputeError) throw disputeError;

        const bookingIds = Array.from(new Set((data || []).map((row) => row.booking_id).filter(Boolean)));
        const userIds = Array.from(new Set((data || []).map((row) => row.raised_by).filter(Boolean)));

        const [bookingRows, profileRows] = await Promise.all([
          bookingIds.length
            ? supabase
                .from("bookings")
                .select("id, escrow_status, total_price_cents, currency")
                .in("id", bookingIds)
            : Promise.resolve({ data: [] }),
          userIds.length
            ? supabase
                .from("profiles")
                .select("id, display_name")
                .in("id", userIds)
            : Promise.resolve({ data: [] }),
        ]);

        const bookingMap = new Map((bookingRows.data || []).map((row: any) => [row.id, row]));
        const profileMap = new Map((profileRows.data || []).map((row: any) => [row.id, row.display_name || "User"]));

        if (cancelled) return;

        setDisputes(
          (data || []).map((row) => {
            const booking = bookingMap.get(row.booking_id) || {};
            return {
              id: row.id,
              bookingId: row.booking_id,
              raisedBy: profileMap.get(row.raised_by) || "Guest",
              type: row.type,
              status: row.status,
              createdAt: row.created_at,
              summary: row.summary,
              escrowStatus: booking.escrow_status || null,
              totalPriceCents: booking.total_price_cents || null,
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

      if (nextStatus === "RESOLVED") {
        await supabase
          .from("bookings")
          .update({ escrow_status: "RELEASED" })
          .eq("id", dispute.bookingId);
      } else if (nextStatus === "UNDER_REVIEW") {
        await supabase
          .from("bookings")
          .update({ escrow_status: "ON_HOLD" })
          .eq("id", dispute.bookingId);
      }

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
      <section className="mx-auto max-w-6xl space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#E5DFC6] bg-white/80 px-4 py-1 text-[11px]">
          <AlertTriangle className="h-3 w-3 text-[#0c4d47]" />
          Disputes
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-[24px] leading-tight">Escrow holds &amp; quality issues</h1>
          <p className="text-sm max-w-3xl text-[#4a4a4a]">
            See all open and historical disputes. Funds may be held in escrow until these are resolved.
          </p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </section>

      <section className="mx-auto max-w-6xl mt-8">
        {loading ? (
          <p className="text-sm text-[#4a4a4a]">Loading disputes…</p>
        ) : disputes.length === 0 ? (
          <p className="text-sm text-[#4a4a4a]">No disputes recorded.</p>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-[#E5DFC6] bg-white/95">
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
                          className="rounded-full border border-emerald-200 px-3 py-1 text-[12px] font-semibold text-emerald-700 hover:bg-emerald-50"
                        >
                          Resolve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusUpdate(dispute, "REJECTED")}
                          disabled={updatingId === dispute.id}
                          className="rounded-full border border-red-200 px-3 py-1 text-[12px] font-semibold text-red-600 hover:bg-red-50"
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
