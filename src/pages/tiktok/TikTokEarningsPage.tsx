// src/pages/tiktok/TikTokEarningsPage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Wallet, ArrowRight } from "lucide-react";
import {
  getMyEarningsSummary,
  getMyLatestEarnings,
  type EarningsEntry,
  type EarningsSummary,
} from "@/services/earningsService";

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency || "USD"} ${amount.toFixed(0)}`;
  }
}

export default function TikTokEarningsPage() {
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [rows, setRows] = useState<EarningsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [s, r] = await Promise.all([
          getMyEarningsSummary(),
          getMyLatestEarnings(),
        ]);
        if (!cancelled) {
          setSummary(s);
          setRows(r as EarningsEntry[]);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Failed to load earnings.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const currency = summary?.currency || "USD";

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225]">
      <section className="mx-auto max-w-5xl px-4 pt-14 pb-6 md:pt-16 md:pb-8">
        <div className="flex items-center justify-between gap-2 mb-4">
          <Link
            to="/tiktok-lab"
            className="inline-flex items-center gap-1 text-[10px] text-[#8D8D8D]"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to TikTok Lab
          </Link>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8D8D]">
              Earnings
            </p>
            <h1 className="font-display text-[22px] md:text-[24px] leading-tight">
              Your Goldsainte earnings
            </h1>
            <p className="text-[11px] md:text-[12px] text-[#4a4a4a] max-w-md">
              See how your storyboards and trip briefs translate into earnings.
              We handle secure payments and payouts — you simply track your
              share here.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-[10px] text-[#8D8D8D]">
            <Wallet className="h-4 w-4 text-[#0c4d47]" />
            <span>Funds move from traveler to escrow to you.</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16 md:pb-20 space-y-5">
        {/* Summary cards */}
        <div className="grid gap-3 md:grid-cols-3 text-[11px]">
          <div className="rounded-3xl bg-white/95 border border-[#E5DFC6] p-3 space-y-1.5">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8D8D]">
              Available
            </p>
            <p className="text-[16px] font-semibold">
              {summary
                ? formatMoney(summary.available, currency)
                : "—"}
            </p>
            <p className="text-[10px] text-[#4a4a4a]">
              Ready to be paid out to your account.
            </p>
          </div>
          <div className="rounded-3xl bg-white/95 border border-[#E5DFC6] p-3 space-y-1.5">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8D8D]">
              Pending
            </p>
            <p className="text-[16px] font-semibold">
              {summary ? formatMoney(summary.pending, currency) : "—"}
            </p>
            <p className="text-[10px] text-[#4a4a4a]">
              Amount in escrow, waiting for trip completion.
            </p>
          </div>
          <div className="rounded-3xl bg-white/95 border border-[#E5DFC6] p-3 space-y-1.5">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8D8D]">
              Paid to date
            </p>
            <p className="text-[16px] font-semibold">
              {summary ? formatMoney(summary.paid, currency) : "—"}
            </p>
            <p className="text-[10px] text-[#4a4a4a]">
              Total earnings that have been fully paid out to you.
            </p>
          </div>
        </div>

        {/* Detail list */}
        <div className="rounded-3xl bg-white/95 border border-[#E5DFC6] p-4 md:p-5 text-[11px] space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8D8D]">
                Per-trip earnings
              </p>
              <p className="text-[12px] font-semibold">
                Bookings that include your share
              </p>
            </div>
          </div>

          {loading && <p className="text-[10px] text-[#8D8D8D]">Loading…</p>}
          {error && (
            <p className="text-[10px] text-red-600">
              {error}
            </p>
          )}

          {!loading && !error && rows.length === 0 && (
            <p className="text-[10px] text-[#8D8D8D]">
              Once travelers begin booking your storyboards and proposals,
              you&apos;ll see each booking — and your earnings — listed here.
            </p>
          )}

          {!loading && !error && rows.length > 0 && (
            <div className="space-y-2">
              {rows.map((row) => (
                <Link
                  key={row.id}
                  to={`/bookings/${row.booking_id}`}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-2 rounded-2xl border border-[#E5DFC6] bg-[#f7f3ea] px-3 py-2 hover:border-[#BFAD72]"
                >
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-semibold">
                      {row.booking?.trip?.title || "Booking"}
                    </p>
                    <p className="text-[10px] text-[#4a4a4a]">
                      {row.booking?.trip?.destination || ""}
                    </p>
                    <p className="text-[10px] text-[#8D8D8D]">
                      Status: {row.status} · Role: {row.role}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <p className="text-[12px] font-semibold">
                      {formatMoney(row.amount, row.currency)}
                    </p>
                    <p className="text-[9px] text-[#8D8D8D]">
                      {new Date(row.created_at).toLocaleDateString()}
                    </p>
                    <div className="inline-flex items-center gap-1 text-[10px] text-[#0c4d47]">
                      View booking
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Footnote / reassurance */}
        <p className="text-[9px] text-[#8D8D8D] max-w-md">
          Goldsainte holds traveler funds for a short protected window before
          releasing payouts to you and your partners. If you ever see something
          that looks incorrect, you can open a support case from the booking
          detail page.
        </p>
      </section>
    </main>
  );
}
