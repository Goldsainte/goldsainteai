import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, DollarSign, User, Clock, CheckCircle, XCircle, BadgeCheck } from "lucide-react";
import { format } from "date-fns";

// Live river: trip_cancellations keyed to trip_bookings (canonical, dollars).
// Approve = record the refund decision + cancel the booking. The refund
// itself is issued by hand in the Stripe dashboard, then recorded here with
// the explicit "Mark refunded" action — same philosophy as Release.

interface CancellationRow {
  id: string;
  trip_booking_id: string;
  traveler_id: string;
  reason: string;
  status: string; // pending | approved | rejected | refunded
  currency: string | null;
  refund_amount: number | null;
  admin_notes: string | null;
  decided_at: string | null;
  stripe_refund_id: string | null;
  refunded_at: string | null;
  created_at: string;
  trip_bookings: {
    id: string;
    status: string;
    total_price: number | null;
    deposit_amount: number | null;
    currency: string | null;
    partner_id: string | null;
    partner_role: string | null;
    payout_paid_at: string | null;
    created_at: string;
    metadata: Record<string, any> | null;
  } | null;
  profiles: {
    username: string | null;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
  } | null;
}

const STATUS_PILL: Record<string, { label: string; classes: string }> = {
  pending: { label: "Pending review", classes: "border-[#8D6B2F]/40 bg-[#C7A962]/15 text-[#8D6B2F]" },
  approved: { label: "Approved — awaiting refund", classes: "border-[#E5DFC6] bg-[#E5DFC6]/40 text-[#0a2225]/70" },
  refunded: { label: "Refunded", classes: "border-[#0c4d47]/25 bg-[#0c4d47]/10 text-[#0c4d47]" },
  rejected: { label: "Rejected", classes: "border-[#E5DFC6] bg-[#fdfaf2] text-[#0a2225]/45" },
};

type DialogAction = "approve" | "reject" | "mark_refunded";

export default function AdminCancellations() {
  const [cancellations, setCancellations] = useState<CancellationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<CancellationRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [action, setAction] = useState<DialogAction | null>(null);
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [adminNotes, setAdminNotes] = useState("");
  const [stripeRefundId, setStripeRefundId] = useState("");
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "refunded" | "rejected">("pending");

  useEffect(() => {
    loadCancellations();
  }, []);

  const loadCancellations = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { data, error } = await supabase
        .from("trip_cancellations")
        .select(`
          *,
          trip_bookings!trip_booking_id (
            id,
            status,
            total_price,
            deposit_amount,
            currency,
            partner_id,
            partner_role,
            payout_paid_at,
            created_at,
            metadata
          ),
          profiles!traveler_id (
            username,
            email,
            first_name,
            last_name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCancellations((data as any) ?? []);
    } catch (error: any) {
      console.error("Error loading cancellations:", error);
      setLoadError(error.message);
      toast.error(`Failed to load cancellations: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Prefill the refund with what the traveler has most likely paid so far:
  // paid_in_full/completed → the full price; otherwise the deposit. The
  // admin can change it — this is a starting point, not a policy engine.
  const suggestedRefund = (row: CancellationRow) => {
    const b = row.trip_bookings;
    if (!b) return 0;
    if (["paid_in_full", "completed"].includes(b.status)) return b.total_price ?? 0;
    return b.deposit_amount ?? 0;
  };

  const openDialog = (row: CancellationRow, a: DialogAction) => {
    setSelected(row);
    setAction(a);
    setRefundAmount(a === "approve" ? String(suggestedRefund(row)) : "");
    setAdminNotes("");
    setStripeRefundId("");
    setDialogOpen(true);
  };

  const handleProcess = async () => {
    if (!selected || !action) return;

    if (action === "approve") {
      const amount = Number(refundAmount);
      if (!Number.isFinite(amount) || amount < 0) {
        toast.error("Refund amount must be a number of 0 or more (dollars).");
        return;
      }
    }
    if (action === "reject" && !adminNotes.trim()) {
      toast.error("A note is required when rejecting — the traveler is told why.");
      return;
    }

    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-process-cancellation", {
        body: {
          cancellationId: selected.id,
          action,
          refundAmount: action === "approve" ? Number(refundAmount) : undefined,
          adminNotes: adminNotes.trim() || undefined,
          stripeRefundId: action === "mark_refunded" ? stripeRefundId.trim() || undefined : undefined,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(data.message);
      setDialogOpen(false);
      loadCancellations();
    } catch (error: any) {
      console.error("Error processing cancellation:", error);
      // supabase.functions.invoke wraps non-2xx bodies in error.context
      let message = error.message;
      try {
        const resp = error?.context;
        if (resp && typeof resp.json === "function") {
          const body = await resp.json();
          if (body?.error) message = body.error;
        }
      } catch {
        /* keep original message */
      }
      toast.error(`Failed to process cancellation: ${message}`);
    } finally {
      setProcessing(false);
    }
  };

  const money = (amount: number | null | undefined, cur?: string | null) => {
    if (amount == null) return "—";
    return `${(cur || "USD").toUpperCase()} ${Number(amount).toFixed(2)}`;
  };

  const travelerName = (row: CancellationRow) => {
    const p = row.profiles;
    if (!p) return "Unknown traveler";
    const full = [p.first_name, p.last_name].filter(Boolean).join(" ");
    return full || p.username || "Unknown traveler";
  };

  const bookingTitle = (row: CancellationRow) =>
    (row.trip_bookings?.metadata as any)?.trip_title || "Trip booking";

  const bookingRef = (row: CancellationRow) =>
    row.trip_bookings ? `GS-${row.trip_bookings.id.slice(0, 8).toUpperCase()}` : "—";

  const buckets = {
    pending: cancellations.filter((c) => c.status === "pending"),
    approved: cancellations.filter((c) => c.status === "approved"),
    refunded: cancellations.filter((c) => c.status === "refunded"),
    rejected: cancellations.filter((c) => c.status === "rejected"),
  };

  const TABS: { key: typeof activeTab; label: string; empty: string }[] = [
    { key: "pending", label: "Pending review", empty: "No pending cancellation requests" },
    { key: "approved", label: "Awaiting refund", empty: "No approved cancellations awaiting refund" },
    { key: "refunded", label: "Refunded", empty: "No refunded cancellations" },
    { key: "rejected", label: "Rejected", empty: "No rejected cancellations" },
  ];

  const visible = TABS.find((t) => t.key === activeTab)!;
  const visibleRows = buckets[activeTab];

  const StatusPill = ({ status }: { status: string }) => {
    const pill = STATUS_PILL[status] ?? { label: status, classes: STATUS_PILL.rejected.classes };
    return (
      <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-medium ${pill.classes}`}>
        {pill.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#f7f3ea]">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#8D6B2F]">Commerce</p>
          <h1 className="mt-2 font-secondary text-[28px] leading-tight text-[#0a2225] md:text-[30px]">
            Cancellations
          </h1>
          <p className="mt-2 max-w-xl text-[14px] text-[#0a2225]/55">
            Traveler cancellation requests from live bookings. Approving cancels the trip and
            records the refund decision.
          </p>
          {loadError && (
            <p className="mt-3 text-sm text-red-700">Failed to load cancellations: {loadError}</p>
          )}
        </div>

        {/* Money flow reminder — refunds are manual by design, like Release. */}
        <div className="mb-8 rounded-2xl border border-[#E5DFC6] bg-[#fdfaf2] p-5">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#8D6B2F]">How refunds move</p>
          <p className="mt-1.5 text-sm leading-relaxed text-[#0a2225]/70">
            Approving records the decision and cancels the booking — it never moves money. Issue
            the refund by hand in the Stripe dashboard, then click <span className="font-medium text-[#0a2225]">Mark refunded</span> on
            the card to record it. If the partner payout was already released, recover it from the
            partner before refunding.
          </p>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={
                activeTab === t.key
                  ? "rounded-full border border-[#0c4d47] bg-[#0c4d47] px-4 py-2.5 text-[13px] text-white transition-colors"
                  : "rounded-full border border-[#E5DFC6] bg-white px-4 py-2.5 text-[13px] text-[#6B7280] transition-colors hover:border-[#C7A962] hover:text-[#0a2225]"
              }
            >
              {t.label}
              <span className={activeTab === t.key ? "ml-1.5 font-semibold text-white/80" : "ml-1.5 font-semibold text-[#8D6B2F]"}>
                {buckets[t.key].length}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-[#0a2225]/55">Loading cancellations…</p>
        ) : (
          <div className="space-y-5">
            {visibleRows.length === 0 ? (
              <div className="rounded-2xl bg-white p-12 text-center shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
                <p className="text-sm text-[#0a2225]/55">{visible.empty}</p>
              </div>
            ) : (
              visibleRows.map((row) => {
                const b = row.trip_bookings;
                const cur = row.currency || b?.currency;
                return (
                  <div key={row.id} className="rounded-2xl bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-secondary text-[17px] text-[#0a2225]">
                          {bookingTitle(row)}
                        </h3>
                        <p className="mt-0.5 text-sm text-[#0a2225]/55">Booking {bookingRef(row)}</p>
                      </div>
                      <StatusPill status={row.status} />
                    </div>

                    <div className="grid gap-2.5 text-sm text-[#0a2225]/80">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-[#0a2225]/40" />
                        <span>{travelerName(row)}</span>
                        {row.profiles?.email && (
                          <span className="text-[#0a2225]/45">({row.profiles.email})</span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
                        <span className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-[#0a2225]/40" />
                          Total {money(b?.total_price, cur)}
                        </span>
                        <span className="text-[#0a2225]/55">Deposit {money(b?.deposit_amount, cur)}</span>
                        {b && (
                          <span className="text-[#0a2225]/55 capitalize">
                            Booking status: {b.status.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>

                      {(row.status === "approved" || row.status === "refunded") && (
                        <div className="flex items-center gap-2">
                          <BadgeCheck className="h-4 w-4 text-[#0a2225]/40" />
                          <span className="font-semibold text-[#0a2225]">
                            Refund decided: {money(row.refund_amount, cur)}
                          </span>
                          {row.stripe_refund_id && (
                            <span className="text-[#0a2225]/45">Stripe: {row.stripe_refund_id}</span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-[#0a2225]/40" />
                        <span>Requested {format(new Date(row.created_at), "MMM dd, yyyy HH:mm")}</span>
                        {row.refunded_at && (
                          <span className="text-[#0a2225]/45">
                            · Refunded {format(new Date(row.refunded_at), "MMM dd, yyyy")}
                          </span>
                        )}
                      </div>
                    </div>

                    {b?.payout_paid_at && row.status !== "refunded" && (
                      <div className="mt-4 rounded-xl border border-[#8D6B2F]/40 bg-[#C7A962]/15 p-3.5">
                        <p className="text-sm leading-relaxed text-[#8D6B2F]">
                          Partner payout was already released on{" "}
                          {format(new Date(b.payout_paid_at), "MMM dd, yyyy")} — recover funds from
                          the partner before refunding the traveler.
                        </p>
                      </div>
                    )}

                    <div className="mt-4 border-t border-[#F1EBDA] pt-3">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-[#0a2225]/45">Traveler's reason</p>
                      <p className="mt-1 text-sm text-[#0a2225]/70">{row.reason}</p>
                    </div>

                    {row.admin_notes && (
                      <div className="mt-4 border-t border-[#F1EBDA] pt-3">
                        <p className="text-[10px] uppercase tracking-[0.14em] text-[#0a2225]/45">Admin notes</p>
                        <p className="mt-1 text-sm text-[#0a2225]/70">{row.admin_notes}</p>
                      </div>
                    )}

                    {row.status === "pending" && (
                      <div className="mt-5 flex gap-3">
                        <button
                          onClick={() => openDialog(row, "approve")}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#0c4d47] px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em] text-[#E5DFC6] transition-colors hover:bg-[#0a2225]"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Approve & cancel trip
                        </button>
                        <button
                          onClick={() => openDialog(row, "reject")}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[#0a2225]/20 px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em] text-[#0a2225]/60 transition-colors hover:bg-[#f7f3ea]"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </button>
                      </div>
                    )}

                    {row.status === "approved" && (
                      <div className="mt-5">
                        <button
                          onClick={() => openDialog(row, "mark_refunded")}
                          className="inline-flex items-center gap-2 rounded-full border border-[#C7A962]/50 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[#8D6B2F] transition-colors hover:bg-[#C7A962]/10"
                        >
                          <BadgeCheck className="h-4 w-4" />
                          Mark refunded
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg rounded-2xl border border-[#E5DFC6] bg-white">
          <DialogHeader>
            <DialogTitle className="font-secondary text-[20px] text-[#0a2225]">
              {action === "approve" && "Approve cancellation"}
              {action === "reject" && "Reject cancellation"}
              {action === "mark_refunded" && "Mark refunded"}
            </DialogTitle>
            <DialogDescription className="text-[#0a2225]/55">
              {action === "approve" &&
                "Sets the refund decision and cancels the booking. No money moves yet."}
              {action === "reject" &&
                "The traveler keeps their booking and is told why the request was declined."}
              {action === "mark_refunded" &&
                "Only do this AFTER issuing the refund in the Stripe dashboard."}
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#F1EBDA] bg-[#fdfaf2] p-4">
                <p className="text-[10px] uppercase tracking-[0.14em] text-[#0a2225]/45">Booking details</p>
                <p className="mt-1.5 text-sm text-[#0a2225]/80">
                  {bookingTitle(selected)} — {bookingRef(selected)}
                </p>
                <p className="text-sm text-[#0a2225]/80">
                  Total {money(selected.trip_bookings?.total_price, selected.currency || selected.trip_bookings?.currency)}
                  {" · "}Deposit {money(selected.trip_bookings?.deposit_amount, selected.currency || selected.trip_bookings?.currency)}
                </p>
                {action === "mark_refunded" && (
                  <p className="mt-1 text-sm font-medium text-[#0a2225]">
                    Refund decided: {money(selected.refund_amount, selected.currency || selected.trip_bookings?.currency)}
                  </p>
                )}
              </div>

              {action === "approve" && (
                <div>
                  <label className="mb-2 block text-[10px] uppercase tracking-[0.14em] text-[#0a2225]/45">
                    Refund amount (dollars — 0 means no refund)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="rounded-xl border-[#E5DFC6] bg-white focus-visible:ring-[#C7A962]"
                  />
                  <p className="mt-2 text-sm text-[#0a2225]/55">
                    Prefilled with what the traveler has paid so far — adjust per the trip's
                    policies before approving.
                  </p>
                </div>
              )}

              {action === "mark_refunded" && (
                <div>
                  <label className="mb-2 block text-[10px] uppercase tracking-[0.14em] text-[#0a2225]/45">
                    Stripe refund ID (optional, e.g. re_…)
                  </label>
                  <Input
                    value={stripeRefundId}
                    onChange={(e) => setStripeRefundId(e.target.value)}
                    placeholder="re_..."
                    className="rounded-xl border-[#E5DFC6] bg-white focus-visible:ring-[#C7A962]"
                  />
                </div>
              )}

              {action !== "mark_refunded" && (
                <div>
                  <label className="mb-2 block text-[10px] uppercase tracking-[0.14em] text-[#0a2225]/45">
                    Admin notes{action === "reject" && " (required — shared with the traveler)"}
                  </label>
                  <Textarea
                    placeholder={
                      action === "approve"
                        ? "Optional notes about this approval..."
                        : "Explain why this cancellation is being rejected..."
                    }
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={4}
                    className="rounded-xl border-[#E5DFC6] bg-white focus-visible:ring-[#C7A962]"
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <button
              onClick={() => setDialogOpen(false)}
              disabled={processing}
              className="rounded-full border border-[#E5DFC6] bg-white px-4 py-2.5 text-[13px] text-[#6B7280] transition-colors hover:border-[#C7A962] hover:text-[#0a2225] disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              onClick={handleProcess}
              disabled={processing || (action === "reject" && !adminNotes.trim())}
              className={
                action === "reject"
                  ? "inline-flex items-center gap-2 rounded-full border border-[#0a2225]/20 px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em] text-[#0a2225]/60 transition-colors hover:bg-[#f7f3ea] disabled:cursor-not-allowed disabled:opacity-40"
                  : "inline-flex items-center gap-2 rounded-full bg-[#0c4d47] px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em] text-[#E5DFC6] transition-colors hover:bg-[#0a2225] disabled:cursor-not-allowed disabled:opacity-40"
              }
            >
              {processing && <Loader2 className="h-4 w-4 animate-spin" />}
              {action === "approve" && "Approve & cancel trip"}
              {action === "reject" && "Reject request"}
              {action === "mark_refunded" && "Record refund"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
