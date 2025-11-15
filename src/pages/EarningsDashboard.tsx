// src/pages/EarningsDashboard.tsx
import { useEffect, useState } from "react";
import {
  getMyEarningsSummary,
  getMyLatestEarnings,
  requestPayout,
} from "@/services/earningsService";

export default function EarningsDashboard() {
  const [summary, setSummary] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [sum, hist] = await Promise.all([
          getMyEarningsSummary(),
          getMyLatestEarnings(),
        ]);
        if (!cancelled) {
          setSummary(sum);
          setHistory(hist);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Could not load earnings.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePayout = async () => {
    setError(null);
    setMessage(null);
    setPayoutLoading(true);
    try {
      await requestPayout();
      setMessage("Payout requested. Funds will be processed by Goldsainte.");
      // reload summary & history
      const [sum, hist] = await Promise.all([
        getMyEarningsSummary(),
        getMyLatestEarnings(),
      ]);
      setSummary(sum);
      setHistory(hist);
    } catch (err: any) {
      setError(err.message || "Could not request payout.");
    } finally {
      setPayoutLoading(false);
    }
  };

  const currency = summary?.currency || "USD";

  return (
    <main className="min-h-screen bg-background text-foreground px-4 py-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <h1 className="text-lg font-semibold">Earnings & payouts</h1>
          <p className="text-xs text-muted-foreground">
            Track what you've earned from Goldsainte bookings and request
            payouts when your balance becomes available.
          </p>
        </header>

        {loading && <p className="text-xs">Loading earnings…</p>}
        {error && (
          <p className="text-xs text-destructive bg-destructive/10 border border-destructive/40 rounded-3xl px-3 py-2">
            {error}
          </p>
        )}
        {message && (
          <p className="text-xs text-primary bg-primary/10 border border-primary/40 rounded-3xl px-3 py-2">
            {message}
          </p>
        )}

        {summary && (
          <section className="grid gap-4 md:grid-cols-4 text-xs">
            <SummaryCard
              label="Pending"
              value={`${currency} ${summary.pending.toFixed(2)}`}
              helper="Not ready to cash out yet."
            />
            <SummaryCard
              label="Available"
              value={`${currency} ${summary.available.toFixed(2)}`}
              helper="Eligible for payout."
            />
            <SummaryCard
              label="Locked for payout"
              value={`${currency} ${summary.locked.toFixed(2)}`}
              helper="Included in a payout in progress."
            />
            <SummaryCard
              label="Paid out"
              value={`${currency} ${summary.paid.toFixed(2)}`}
              helper="Successfully withdrawn."
            />
          </section>
        )}

        {summary && (
          <section className="rounded-3xl bg-card border border-border p-4 text-xs">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="text-xs font-semibold">
                  Ready to withdraw your balance?
                </p>
                <p className="text-xs text-muted-foreground">
                  Once a booking is complete and outside the dispute window,
                  earnings move from pending to available. You can request a payout
                  of your available balance at any time.
                </p>
              </div>
              <button
                disabled={payoutLoading || !summary || summary.available <= 0}
                onClick={handlePayout}
                className="rounded-full bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {payoutLoading
                  ? "Requesting payout…"
                  : summary.available > 0
                  ? `Request payout (${currency} ${summary.available.toFixed(2)})`
                  : "No available balance yet"}
              </button>
            </div>
          </section>
        )}

        <section className="rounded-3xl bg-card border border-border p-4 text-xs space-y-2">
          <h2 className="text-sm font-semibold">Recent earnings</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="border-b border-muted">
                <tr>
                  <th className="py-2 pr-3">Booking</th>
                  <th className="py-2 pr-3">Amount</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Role</th>
                  <th className="py-2 pr-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-muted"
                  >
                    <td className="py-2 pr-3">
                      {row.bookings?.trip_id || row.booking_id}
                    </td>
                    <td className="py-2 pr-3">
                      {row.currency || currency} {Number(row.amount).toFixed(2)}
                    </td>
                    <td className="py-2 pr-3">{row.status}</td>
                    <td className="py-2 pr-3">{row.role}</td>
                    <td className="py-2 pr-3">
                      {new Date(row.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {history.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-2 text-muted-foreground"
                    >
                      No earnings yet. Once your first trip is booked and paid,
                      you'll see it here.
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

function SummaryCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-3xl bg-card border border-border p-4 space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{helper}</p>
    </div>
  );
}
