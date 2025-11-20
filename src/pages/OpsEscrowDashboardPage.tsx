import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type BookingStatus =
  | "draft"
  | "payment_pending"
  | "in_escrow"
  | "paid_out"
  | "cancelled"
  | "refunded";

interface OpsBookingRow {
  booking_id: string;
  trip_request_id: string;
  proposal_id: string | null;
  booking_status: BookingStatus;
  currency: string;
  amount_total_cents: number;
  platform_commission: number;
  partner_payout: number;
  payment_provider: string | null;
  payment_reference: string | null;
  payment_url: string | null;
  booking_created_at: string;
  booking_updated_at: string;
  trip_status: string;
  accepted_at: string | null;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  travelers_adults: number | null;
  travelers_children: number | null;
  budget_min: number | null;
  budget_max: number | null;
  collection_title: string | null;
  collection_tags: string[] | null;
  brand_name: string | null;
  brand_profile_id: string | null;
  brand_avatar_url: string | null;
}

export default function OpsEscrowDashboardPage() {
  const [rows, setRows] = useState<OpsBookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("in_escrow");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("trip_bookings_ops_view")
        .select("*")
        .order("booking_created_at", { ascending: false });

      if (!error && data) {
        setRows(data as OpsBookingRow[]);
      }
      setLoading(false);
    };
    void load();
  }, []);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return rows;
    return rows.filter((r) => r.booking_status === statusFilter);
  }, [rows, statusFilter]);

  const totals = useMemo(() => {
    let inEscrow = 0;
    let paidOutThisMonth = 0;
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${now.getMonth()}`;

    rows.forEach((r) => {
      if (r.booking_status === "in_escrow") {
        inEscrow += r.amount_total_cents;
      }
      if (r.booking_status === "paid_out") {
        const d = new Date(r.booking_updated_at);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (key === monthKey) {
          paidOutThisMonth += r.amount_total_cents;
        }
      }
    });

    return { inEscrow, paidOutThisMonth };
  }, [rows]);

  const statusLabel: Record<BookingStatus, string> = {
    draft: "Draft",
    payment_pending: "Payment pending",
    in_escrow: "In escrow",
    paid_out: "Paid out",
    cancelled: "Cancelled",
    refunded: "Refunded",
  };

  const statusColor: Record<BookingStatus, string> = {
    draft: "bg-slate-50 text-slate-800 border-slate-200",
    payment_pending: "bg-amber-50 text-amber-800 border-amber-200",
    in_escrow: "bg-blue-50 text-blue-800 border-blue-200",
    paid_out: "bg-emerald-50 text-emerald-800 border-emerald-200",
    cancelled: "bg-red-50 text-red-800 border-red-200",
    refunded: "bg-purple-50 text-purple-800 border-purple-200",
  };

  const handleStatusUpdate = async (
    bookingId: string,
    newStatus: BookingStatus
  ) => {
    setUpdatingId(bookingId);
    try {
      const { error } = await supabase.rpc(
        "admin_update_trip_booking_status",
        {
          p_booking_id: bookingId,
          p_new_status: newStatus,
        }
      );
      if (error) throw error;

      setRows((prev) =>
        prev.map((r) =>
          r.booking_id === bookingId
            ? { ...r, booking_status: newStatus, booking_updated_at: new Date().toISOString() }
            : r
        )
      );
    } catch (err) {
      console.error("Failed to update booking status", err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>Escrow & Payout · Goldsainte Ops</title>
      </Helmet>

      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-display text-xl text-gs-ink">
              Escrow & Payout
            </h1>
            <p className="text-xs text-gs-ink-light">
              Track trip payments in escrow, payouts to partners, and refunds.
            </p>
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) =>
              setStatusFilter(v as BookingStatus | "all")
            }
          >
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="in_escrow">In escrow</SelectItem>
              <SelectItem value="payment_pending">Payment pending</SelectItem>
              <SelectItem value="paid_out">Paid out</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </header>

        {/* Summary cards */}
        <section className="grid gap-4 md:grid-cols-2">
          <Card className="bg-background border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                In escrow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-foreground">
                ${(totals.inEscrow / 100).toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Total funds currently held in Goldsainte escrow.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-background border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Paid out this month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-foreground">
                ${(totals.paidOutThisMonth / 100).toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Completed trips where funds have been released to partners.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Table */}
        <section className="rounded-2xl border border-border bg-background">
          <div className="border-b border-border px-4 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Bookings
            </p>
          </div>
          <div className="max-h-[520px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-[11px] text-muted-foreground">
                  <TableHead>Trip</TableHead>
                  <TableHead>Brand / Collection</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-xs text-center">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-xs text-center">
                      No bookings found for this filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => {
                    const dateRange = r.start_date && r.end_date
                      ? `${new Date(r.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${new Date(r.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
                      : "Dates TBD";
                    const travelers = (r.travelers_adults || 0) + (r.travelers_children || 0);
                    
                    return (
                      <TableRow key={r.booking_id} className="text-xs">
                        <TableCell>
                          <div className="space-y-0.5">
                            <p className="font-semibold text-foreground">
                              {r.destination || "Custom trip"}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {dateRange} · {travelers} travelers
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <p className="text-foreground">
                              {r.brand_name ?? "Brand"}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {r.collection_title
                                ? `"${r.collection_title}"`
                                : "No collection"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-semibold text-foreground">
                            {r.currency.toUpperCase()}{" "}
                            {(r.amount_total_cents / 100).toLocaleString(
                              undefined,
                              { maximumFractionDigits: 0 }
                            )}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`border px-2 py-0.5 text-[11px] ${
                              statusColor[r.booking_status]
                            }`}
                          >
                            {statusLabel[r.booking_status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(
                            r.booking_created_at
                          ).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <OpsBookingActions
                            row={r}
                            updating={updatingId === r.booking_id}
                            onUpdateStatus={handleStatusUpdate}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </>
  );
}

function OpsBookingActions({
  row,
  updating,
  onUpdateStatus,
}: {
  row: OpsBookingRow;
  updating: boolean;
  onUpdateStatus: (id: string, s: BookingStatus) => void;
}) {
  const canMarkInEscrow = row.booking_status === "payment_pending";
  const canMarkPaidOut = row.booking_status === "in_escrow";
  const canRefund =
    row.booking_status === "in_escrow" ||
    row.booking_status === "payment_pending";

  return (
    <div className="inline-flex items-center gap-1">
      {canMarkInEscrow && (
        <Button
          size="sm"
          variant="outline"
          disabled={updating}
          onClick={() => onUpdateStatus(row.booking_id, "in_escrow")}
          className="h-7 text-xs"
        >
          Mark in escrow
        </Button>
      )}
      {canMarkPaidOut && (
        <Button
          size="sm"
          className="h-7 text-xs bg-gs-ink text-gs-cream hover:bg-gs-ink/90"
          disabled={updating}
          onClick={() => onUpdateStatus(row.booking_id, "paid_out")}
        >
          Mark paid out
        </Button>
      )}
      {canRefund && (
        <Button
          size="sm"
          variant="outline"
          disabled={updating}
          onClick={() => onUpdateStatus(row.booking_id, "refunded")}
          className="h-7 text-xs"
        >
          Mark refunded
        </Button>
      )}
    </div>
  );
}
