// src/pages/EarningsDashboard.tsx
import { useEffect, useState } from "react";
import {
  getEarningsSummary,
  getEarningsLedger,
  getPayoutHistory,
  requestPayout,
  type EarningsSummary,
  type EarningsEntry,
  type PayoutEntry,
} from "@/services/earningsService";
import { useToast } from "@/hooks/use-toast";

export default function EarningsDashboard() {
  const { toast } = useToast();
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [ledger, setLedger] = useState<EarningsEntry[]>([]);
  const [payouts, setPayouts] = useState<PayoutEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [summaryData, ledgerData, payoutsData] = await Promise.all([
          getEarningsSummary(),
          getEarningsLedger(),
          getPayoutHistory(),
        ]);

        if (!cancelled) {
          setSummary(summaryData);
          setLedger(ledgerData);
          setPayouts(payoutsData);
        }
      } catch (error: any) {
        if (!cancelled) {
          toast({
            title: "Error loading earnings",
            description: error.message,
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const handleWithdraw = async () => {
    if (!summary || summary.available <= 0) return;

    setWithdrawing(true);
    try {
      await requestPayout(summary.available, summary.currency);
      toast({
        title: "Withdrawal initiated",
        description: "Your payout request has been submitted. Funds typically arrive in 2-5 business days.",
      });

      // Reload data
      const [summaryData, payoutsData] = await Promise.all([
        getEarningsSummary(),
        getPayoutHistory(),
      ]);
      setSummary(summaryData);
      setPayouts(payoutsData);
    } catch (error: any) {
      toast({
        title: "Withdrawal failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background text-foreground px-4 py-6">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm text-muted-foreground">Loading earnings...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground px-4 py-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <h1 className="text-2xl font-semibold">Earnings</h1>
          <p className="text-sm text-muted-foreground">
            Track your commissions and payouts
          </p>
        </header>

        {/* Summary Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-3xl bg-card border border-border p-4 space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Pending
            </p>
            <p className="text-2xl font-bold text-card-foreground">
              {summary?.currency} {summary?.pending.toFixed(2) || "0.00"}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Awaiting booking completion
            </p>
          </div>

          <div className="rounded-3xl bg-card border border-primary/30 p-4 space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Available
            </p>
            <p className="text-2xl font-bold text-primary">
              {summary?.currency} {summary?.available.toFixed(2) || "0.00"}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Ready to withdraw
            </p>
          </div>

          <div className="rounded-3xl bg-card border border-border p-4 space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              In Transit
            </p>
            <p className="text-2xl font-bold text-card-foreground">
              {summary?.currency} {summary?.locked.toFixed(2) || "0.00"}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Being processed
            </p>
          </div>

          <div className="rounded-3xl bg-card border border-border p-4 space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Paid Out
            </p>
            <p className="text-2xl font-bold text-card-foreground">
              {summary?.currency} {summary?.paid.toFixed(2) || "0.00"}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Total withdrawn
            </p>
          </div>
        </section>

        {/* Withdraw Button */}
        {summary && summary.available > 0 && (
          <section className="rounded-3xl bg-card border border-primary/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-card-foreground">
                  Withdraw Available Funds
                </h3>
                <p className="text-xs text-muted-foreground">
                  Transfer {summary.currency} {summary.available.toFixed(2)} to your connected account
                </p>
              </div>
              <button
                onClick={handleWithdraw}
                disabled={withdrawing}
                className="rounded-full bg-primary text-primary-foreground px-6 py-2 text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {withdrawing ? "Processing..." : "Withdraw"}
              </button>
            </div>
          </section>
        )}

        {/* Recent Earnings */}
        <section className="rounded-3xl bg-card border border-border p-4 space-y-3">
          <h2 className="text-base font-semibold text-card-foreground">Recent Earnings</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="border-b border-border">
                <tr>
                  <th className="py-2 pr-3 text-muted-foreground font-medium">Trip</th>
                  <th className="py-2 pr-3 text-muted-foreground font-medium">Role</th>
                  <th className="py-2 pr-3 text-muted-foreground font-medium">Amount</th>
                  <th className="py-2 pr-3 text-muted-foreground font-medium">Status</th>
                  <th className="py-2 pr-3 text-muted-foreground font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((entry) => (
                  <tr key={entry.id} className="border-b border-border/50">
                    <td className="py-2 pr-3 text-card-foreground">
                      {entry.booking?.trip?.title || "Untitled Trip"}
                      {entry.booking?.trip?.destination && (
                        <span className="text-muted-foreground">
                          {" · "}
                          {entry.booking.trip.destination}
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      <span className="capitalize text-muted-foreground">{entry.role}</span>
                    </td>
                    <td className="py-2 pr-3 font-medium text-card-foreground">
                      {entry.currency} {entry.amount.toFixed(2)}
                    </td>
                    <td className="py-2 pr-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          entry.status === "paid"
                            ? "bg-primary/20 text-primary"
                            : entry.status === "available"
                            ? "bg-accent/20 text-accent-foreground"
                            : entry.status === "locked"
                            ? "bg-muted text-muted-foreground"
                            : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {entry.status}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-muted-foreground">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {ledger.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-muted-foreground">
                      No earnings yet. Complete bookings to start earning!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Payout History */}
        <section className="rounded-3xl bg-card border border-border p-4 space-y-3">
          <h2 className="text-base font-semibold text-card-foreground">Payout History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="border-b border-border">
                <tr>
                  <th className="py-2 pr-3 text-muted-foreground font-medium">Date</th>
                  <th className="py-2 pr-3 text-muted-foreground font-medium">Amount</th>
                  <th className="py-2 pr-3 text-muted-foreground font-medium">Provider</th>
                  <th className="py-2 pr-3 text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((payout) => (
                  <tr key={payout.id} className="border-b border-border/50">
                    <td className="py-2 pr-3 text-card-foreground">
                      {new Date(payout.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-2 pr-3 font-medium text-card-foreground">
                      {payout.currency} {payout.amount.toFixed(2)}
                    </td>
                    <td className="py-2 pr-3 capitalize text-muted-foreground">
                      {payout.provider}
                    </td>
                    <td className="py-2 pr-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          payout.status === "paid"
                            ? "bg-primary/20 text-primary"
                            : payout.status === "failed"
                            ? "bg-destructive/20 text-destructive"
                            : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {payout.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {payouts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-muted-foreground">
                      No payouts yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
