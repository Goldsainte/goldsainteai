import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Calendar, DollarSign, User, Clock, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

interface CancellationWithDetails {
  id: string;
  booking_id: string;
  user_id: string;
  cancellation_reason: string;
  cancellation_date: string;
  refund_percentage: number;
  refund_amount: number;
  original_amount: number;
  currency: string;
  status: string;
  admin_notes: string | null;
  processed_at: string | null;
  bookings: {
    booking_reference: string;
    booking_type: string;
    destination: string;
    check_in_date: string;
    check_out_date: string;
  };
  profiles: {
    username: string;
    email: string;
  };
}

const STATUS_PILL: Record<string, { label: string; classes: string }> = {
  pending: { label: "Pending review", classes: "border-[#8D6B2F]/40 bg-[#C7A962]/15 text-[#8D6B2F]" },
  approved: { label: "Approved", classes: "border-[#E5DFC6] bg-[#E5DFC6]/40 text-[#0a2225]/70" },
  completed: { label: "Refund processed", classes: "border-[#0c4d47]/25 bg-[#0c4d47]/10 text-[#0c4d47]" },
  rejected: { label: "Rejected", classes: "border-[#E5DFC6] bg-[#fdfaf2] text-[#0a2225]/45" },
};

export default function AdminCancellations() {
  const [cancellations, setCancellations] = useState<CancellationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedCancellation, setSelectedCancellation] = useState<CancellationWithDetails | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [customRefundPercentage, setCustomRefundPercentage] = useState<number | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "processed" | "rejected">("pending");

  useEffect(() => {
    loadCancellations();
  }, []);

  const loadCancellations = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { data, error } = await supabase
        .from("booking_cancellations")
        .select(`
          *,
          bookings!inner (
            booking_reference,
            booking_type,
            destination,
            check_in_date,
            check_out_date
          ),
          profiles!user_id (
            username,
            email
          )
        `)
        .order("cancellation_date", { ascending: false });

      if (error) throw error;
      setCancellations(data as any || []);
    } catch (error: any) {
      console.error("Error loading cancellations:", error);
      setLoadError(error.message);
      toast.error(`Failed to load cancellations: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (cancellation: CancellationWithDetails, actionType: "approve" | "reject") => {
    setSelectedCancellation(cancellation);
    setAction(actionType);
    setCustomRefundPercentage(actionType === "approve" ? cancellation.refund_percentage : null);
    setAdminNotes("");
    setDialogOpen(true);
  };

  const handleProcessCancellation = async () => {
    if (!selectedCancellation || !action) return;

    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-process-cancellation", {
        body: {
          cancellationId: selectedCancellation.id,
          action,
          customRefundPercentage: action === "approve" ? customRefundPercentage : undefined,
          adminNotes: adminNotes.trim() || undefined,
        },
      });

      if (error) throw error;

      toast.success(data.message);

      setDialogOpen(false);
      loadCancellations();
    } catch (error: any) {
      console.error("Error processing cancellation:", error);
      toast.error(`Failed to process cancellation: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const calculateRefundPreview = () => {
    if (!selectedCancellation || customRefundPercentage === null) return null;
    const amount = (selectedCancellation.original_amount * customRefundPercentage) / 100;
    return amount.toFixed(2);
  };

  const pendingCancellations = cancellations.filter((c) => c.status === "pending");
  const approvedCancellations = cancellations.filter((c) => c.status === "approved");
  const processedCancellations = cancellations.filter((c) => c.status === "completed");
  const rejectedCancellations = cancellations.filter((c) => c.status === "rejected");

  const TABS: { key: typeof activeTab; label: string; rows: CancellationWithDetails[]; empty: string }[] = [
    { key: "pending", label: "Pending review", rows: pendingCancellations, empty: "No pending cancellation requests" },
    { key: "approved", label: "Approved", rows: approvedCancellations, empty: "No approved cancellations" },
    { key: "processed", label: "Refund processed", rows: processedCancellations, empty: "No processed refunds" },
    { key: "rejected", label: "Rejected", rows: rejectedCancellations, empty: "No rejected cancellations" },
  ];

  const visible = TABS.find((t) => t.key === activeTab)!;

  const StatusPill = ({ status }: { status: string }) => {
    const pill = STATUS_PILL[status] ?? { label: status, classes: STATUS_PILL.rejected.classes };
    return (
      <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-medium ${pill.classes}`}>
        {pill.label}
      </span>
    );
  };

  const CancellationCard = ({ cancellation }: { cancellation: CancellationWithDetails }) => (
    <div className="rounded-2xl bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-secondary text-[17px] text-[#0a2225]">
            {cancellation.bookings.booking_type} — {cancellation.bookings.destination}
          </h3>
          <p className="mt-0.5 text-sm text-[#0a2225]/55">
            Booking #{cancellation.bookings.booking_reference}
          </p>
        </div>
        <StatusPill status={cancellation.status} />
      </div>

      <div className="grid gap-2.5 text-sm text-[#0a2225]/80">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-[#0a2225]/40" />
          <span>{cancellation.profiles?.username || "Unknown user"}</span>
          <span className="text-[#0a2225]/45">({cancellation.profiles?.email})</span>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[#0a2225]/40" />
          <span>
            {format(new Date(cancellation.bookings.check_in_date), "MMM dd, yyyy")}
            {cancellation.bookings.check_out_date &&
              ` – ${format(new Date(cancellation.bookings.check_out_date), "MMM dd, yyyy")}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-[#0a2225]/40" />
          <span>
            Original: {cancellation.currency} {cancellation.original_amount.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-[#0a2225]/40" />
          <span className="font-semibold text-[#0a2225]">
            Refund ({cancellation.refund_percentage}%): {cancellation.currency}{" "}
            {cancellation.refund_amount.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#0a2225]/40" />
          <span>Requested {format(new Date(cancellation.cancellation_date), "MMM dd, yyyy HH:mm")}</span>
        </div>
      </div>

      {cancellation.cancellation_reason && (
        <div className="mt-4 border-t border-[#F1EBDA] pt-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#0a2225]/45">Traveler's reason</p>
          <p className="mt-1 text-sm text-[#0a2225]/70">{cancellation.cancellation_reason}</p>
        </div>
      )}

      {cancellation.admin_notes && (
        <div className="mt-4 border-t border-[#F1EBDA] pt-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#0a2225]/45">Admin notes</p>
          <p className="mt-1 text-sm text-[#0a2225]/70">{cancellation.admin_notes}</p>
        </div>
      )}

      {cancellation.status === "pending" && (
        <div className="mt-5 flex gap-3">
          <button
            onClick={() => handleOpenDialog(cancellation, "approve")}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#0c4d47] px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em] text-[#E5DFC6] transition-colors hover:bg-[#0a2225]"
          >
            <CheckCircle className="h-4 w-4" />
            Approve
          </button>
          <button
            onClick={() => handleOpenDialog(cancellation, "reject")}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[#0a2225]/20 px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em] text-[#0a2225]/60 transition-colors hover:bg-[#f7f3ea]"
          >
            <XCircle className="h-4 w-4" />
            Reject
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f7f3ea]">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#8D6B2F]">Commerce</p>
          <h1 className="mt-2 font-secondary text-[28px] leading-tight text-[#0a2225] md:text-[30px]">
            Cancellations
          </h1>
          <p className="mt-2 max-w-xl text-[14px] text-[#0a2225]/55">
            Review cancellation requests and set the refund before it's processed.
          </p>
          {loadError && (
            <p className="mt-3 text-sm text-red-700">Failed to load cancellations: {loadError}</p>
          )}
        </div>

        {/* Honest-pages notice: the whole cancellation subsystem (request →
            review → refund) still runs on the legacy bookings river. Live
            trip bookings have no cancellation-request flow yet, so nothing
            can appear here from real bookings. Remove this band when the
            rewire ships. */}
        <div className="mb-8 rounded-2xl border border-[#8D6B2F]/40 bg-[#C7A962]/15 p-5">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#8D6B2F]">Not yet on the live river</p>
          <p className="mt-1.5 text-sm leading-relaxed text-[#0a2225]/70">
            Cancellation requests aren't wired to live trip bookings yet — travelers currently
            have no in-app way to request one, so this room only sees the legacy flow. Until the
            rewire ships, handle any live-booking cancellation manually (refund in Stripe, then
            update the booking).
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
                {t.rows.length}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-[#0a2225]/55">Loading cancellations…</p>
        ) : (
          <div className="space-y-5">
            {visible.rows.length === 0 ? (
              <div className="rounded-2xl bg-white p-12 text-center shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
                <p className="text-sm text-[#0a2225]/55">{visible.empty}</p>
              </div>
            ) : (
              visible.rows.map((cancellation) => (
                <CancellationCard key={cancellation.id} cancellation={cancellation} />
              ))
            )}
          </div>
        )}
      </div>

      {/* Approval/Rejection Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg rounded-2xl border border-[#E5DFC6] bg-white">
          <DialogHeader>
            <DialogTitle className="font-secondary text-[20px] text-[#0a2225]">
              {action === "approve" ? "Approve cancellation" : "Reject cancellation"}
            </DialogTitle>
            <DialogDescription className="text-[#0a2225]/55">
              {action === "approve"
                ? "Review and adjust the refund amount if necessary"
                : "Provide a reason for rejecting this cancellation request"}
            </DialogDescription>
          </DialogHeader>

          {selectedCancellation && (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#F1EBDA] bg-[#fdfaf2] p-4">
                <p className="text-[10px] uppercase tracking-[0.14em] text-[#0a2225]/45">Booking details</p>
                <p className="mt-1.5 text-sm text-[#0a2225]/80">
                  {selectedCancellation.bookings.booking_type} — {selectedCancellation.bookings.destination}
                </p>
                <p className="text-sm text-[#0a2225]/80">
                  Original amount: {selectedCancellation.currency} {selectedCancellation.original_amount.toFixed(2)}
                </p>
              </div>

              {action === "approve" && (
                <div>
                  <label className="mb-2 block text-[10px] uppercase tracking-[0.14em] text-[#0a2225]/45">
                    Refund percentage (%)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={customRefundPercentage ?? ""}
                    onChange={(e) => setCustomRefundPercentage(parseFloat(e.target.value) || 0)}
                    className="rounded-xl border-[#E5DFC6] bg-white focus-visible:ring-[#C7A962]"
                  />
                  {customRefundPercentage !== null && (
                    <p className="mt-2 text-sm text-[#0a2225]/55">
                      Refund amount: {selectedCancellation.currency} {calculateRefundPreview()}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-[0.14em] text-[#0a2225]/45">
                  Admin notes{action === "reject" && " (required)"}
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
              onClick={handleProcessCancellation}
              disabled={processing || (action === "reject" && !adminNotes.trim())}
              className={
                action === "approve"
                  ? "inline-flex items-center gap-2 rounded-full bg-[#0c4d47] px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em] text-[#E5DFC6] transition-colors hover:bg-[#0a2225] disabled:cursor-not-allowed disabled:opacity-40"
                  : "inline-flex items-center gap-2 rounded-full border border-[#0a2225]/20 px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em] text-[#0a2225]/60 transition-colors hover:bg-[#f7f3ea] disabled:cursor-not-allowed disabled:opacity-40"
              }
            >
              {processing && <Loader2 className="h-4 w-4 animate-spin" />}
              {action === "approve" ? "Approve & process" : "Reject request"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
