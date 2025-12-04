// src/pages/EarningsDashboard.tsx
import { useEffect, useState } from "react";
import { ArrowLeft, Wallet, Clock, Lock, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getMyEarningsSummary,
  getMyLatestEarnings,
  requestPayout,
} from "@/services/earningsService";

export default function EarningsDashboard() {
  const navigate = useNavigate();
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

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      pending: "bg-[#FDF9F0] text-[#C7A962] border border-[#C7A962]/30",
      available: "bg-[#0c4d47]/10 text-[#0c4d47] border border-[#0c4d47]/30",
      locked: "bg-[#E5DFC6]/50 text-[#6B7280] border border-[#E5DFC6]",
      paid: "bg-[#0c4d47] text-white",
    };
    return statusStyles[status.toLowerCase()] || "bg-[#E5DFC6]/50 text-[#6B7280]";
  };

  return (
    <main className="min-h-screen bg-[#FDF9F0] text-[#0a2225] px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#0a2225] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {/* Header */}
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-[#C7A962] font-medium">
            Financial Overview
          </p>
          <h1 className="text-2xl md:text-3xl font-secondary text-[#0a2225]">
            Earnings & Payouts
          </h1>
          <p className="text-sm text-[#6B7280] max-w-2xl">
            Track what you've earned from Goldsainte bookings and request
            payouts when your balance becomes available.
          </p>
        </header>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center gap-3 text-sm text-[#6B7280]">
            <div className="w-4 h-4 border-2 border-[#C7A962] border-t-transparent rounded-full animate-spin" />
            Loading earnings…
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Success Message */}
        {message && (
          <div className="bg-[#0c4d47]/10 border border-[#0c4d47]/30 rounded-2xl px-4 py-3 text-sm text-[#0c4d47]">
            {message}
          </div>
        )}

        {/* Summary Cards */}
        {summary && (
          <section className="grid gap-4 md:grid-cols-4">
            <SummaryCard
              icon={<Clock className="w-5 h-5 text-[#C7A962]" />}
              label="Pending"
              value={`${currency} ${summary.pending.toFixed(2)}`}
              helper="Not ready to cash out yet"
            />
            <SummaryCard
              icon={<Wallet className="w-5 h-5 text-[#0c4d47]" />}
              label="Available"
              value={`${currency} ${summary.available.toFixed(2)}`}
              helper="Eligible for payout"
              highlight
            />
            <SummaryCard
              icon={<Lock className="w-5 h-5 text-[#6B7280]" />}
              label="Locked"
              value={`${currency} ${summary.locked.toFixed(2)}`}
              helper="Payout in progress"
            />
            <SummaryCard
              icon={<CheckCircle className="w-5 h-5 text-[#0c4d47]" />}
              label="Paid Out"
              value={`${currency} ${summary.paid.toFixed(2)}`}
              helper="Successfully withdrawn"
            />
          </section>
        )}

        {/* Payout CTA */}
        {summary && (
          <section className="bg-white border border-[#E5DFC6] rounded-2xl p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-lg font-secondary text-[#0a2225]">
                  Ready to withdraw?
                </h3>
                <p className="text-sm text-[#6B7280]">
                  Once a booking is complete and outside the dispute window,
                  earnings move from pending to available.
                </p>
              </div>
              <button
                disabled={payoutLoading || !summary || summary.available <= 0}
                onClick={handlePayout}
                className="rounded-full bg-[#0c4d47] text-white px-6 py-3 text-sm font-medium hover:bg-[#0a3d39] disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap transition-colors"
              >
                {payoutLoading
                  ? "Requesting payout…"
                  : summary.available > 0
                  ? `Request payout (${currency} ${summary.available.toFixed(2)})`
                  : "No available balance"}
              </button>
            </div>
          </section>
        )}

        {/* Recent Earnings Table */}
        <section className="bg-white border border-[#E5DFC6] rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-secondary text-[#0a2225]">
            Recent Earnings
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-[#E5DFC6]">
                  <th className="py-3 pr-4 text-xs uppercase tracking-wider text-[#6B7280] font-medium">
                    Booking
                  </th>
                  <th className="py-3 pr-4 text-xs uppercase tracking-wider text-[#6B7280] font-medium">
                    Amount
                  </th>
                  <th className="py-3 pr-4 text-xs uppercase tracking-wider text-[#6B7280] font-medium">
                    Status
                  </th>
                  <th className="py-3 pr-4 text-xs uppercase tracking-wider text-[#6B7280] font-medium">
                    Role
                  </th>
                  <th className="py-3 pr-4 text-xs uppercase tracking-wider text-[#6B7280] font-medium">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-[#E5DFC6]/50 hover:bg-[#FDF9F0]/50 transition-colors"
                  >
                    <td className="py-4 pr-4 text-[#0a2225]">
                      {row.bookings?.trip_id || row.booking_id}
                    </td>
                    <td className="py-4 pr-4 font-medium text-[#0a2225]">
                      {row.currency || currency} {Number(row.amount).toFixed(2)}
                    </td>
                    <td className="py-4 pr-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-4 pr-4 text-[#6B7280] capitalize">
                      {row.role}
                    </td>
                    <td className="py-4 pr-4 text-[#6B7280]">
                      {new Date(row.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {history.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <div className="space-y-2">
                        <Wallet className="w-10 h-10 mx-auto text-[#E5DFC6]" />
                        <p className="text-[#6B7280]">
                          No earnings yet
                        </p>
                        <p className="text-xs text-[#9CA3AF]">
                          Once your first trip is booked and paid, you'll see it here.
                        </p>
                      </div>
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
  icon,
  label,
  value,
  helper,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-5 space-y-3 transition-all ${
      highlight 
        ? "bg-white border-2 border-[#C7A962] shadow-sm" 
        : "bg-white border border-[#E5DFC6]"
    }`}>
      <div className="flex items-center justify-between">
        {icon}
        <p className="text-xs uppercase tracking-wider text-[#6B7280] font-medium">
          {label}
        </p>
      </div>
      <p className={`text-xl font-secondary ${highlight ? "text-[#C7A962]" : "text-[#0a2225]"}`}>
        {value}
      </p>
      <p className="text-xs text-[#9CA3AF]">{helper}</p>
    </div>
  );
}
