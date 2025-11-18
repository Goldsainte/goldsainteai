import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Wallet } from "lucide-react";
import {
  getPartnerBookingEarnings,
  type PartnerEarningSnapshot,
} from "@/services/earningsService";

function formatMoney(amountCents: number, currency: string) {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
  return formatter.format(amountCents / 100);
}

interface PartnerEarningsViewProps {
  role: "creator" | "agent";
  title: string;
  intro: string;
  backLink: string;
  backLabel: string;
}

export function PartnerEarningsView({
  role,
  title,
  intro,
  backLink,
  backLabel,
}: PartnerEarningsViewProps) {
  const [snapshot, setSnapshot] = useState<PartnerEarningSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getPartnerBookingEarnings(role);
        if (!cancelled) {
          setSnapshot(data);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Failed to load earnings.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [role]);

  const currency = snapshot?.currency || "USD";
  const total = (snapshot?.pending || 0) + (snapshot?.released || 0);

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225]">
      <section className="mx-auto max-w-5xl px-4 pt-14 pb-6 md:pt-16 md:pb-8">
        <div className="flex items-center justify-between gap-2 mb-4">
          <Link
            to={backLink}
            className="inline-flex items-center gap-1 text-[10px] text-[#8D8D8D]"
          >
            <ArrowLeft className="h-3 w-3" />
            {backLabel}
          </Link>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8D8D]">
              Earnings
            </p>
            <h1 className="font-display text-[22px] md:text-[24px] leading-tight">
              {title}
            </h1>
            <p className="text-[11px] md:text-[12px] text-[#4a4a4a] max-w-md">
              {intro}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-[10px] text-[#8D8D8D]">
            <Wallet className="h-4 w-4 text-[#0c4d47]" />
            <span>Funds move from traveler to escrow to you.</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16 md:pb-20 space-y-5">
        <div className="grid gap-3 md:grid-cols-3 text-[11px]">
          <SummaryCard label="Released" value={snapshot ? formatMoney(snapshot.released, currency) : "—"} description="Already paid out" />
          <SummaryCard label="Held in escrow" value={snapshot ? formatMoney(snapshot.pending, currency) : "—"} description="Awaiting milestone" />
          <SummaryCard label="Lifetime" value={snapshot ? formatMoney(total, currency) : "—"} description="Total earned" />
        </div>

        <div className="rounded-3xl bg-white/95 border border-[#E5DFC6] p-4 md:p-5 text-[11px] space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8D8D]">
                Booking payouts
              </p>
              <p className="text-[12px] font-semibold">Latest activity</p>
            </div>
          </div>

          {loading && <p className="text-[10px] text-[#8D8D8D]">Loading…</p>}
          {error && <p className="text-[10px] text-red-600">{error}</p>}

          {!loading && !error && snapshot && snapshot.bookings.length === 0 && (
            <p className="text-[10px] text-[#8D8D8D]">
              Once travelers confirm bookings with you, each payout will appear here.
            </p>
          )}

          {!loading && !error && snapshot && snapshot.bookings.length > 0 && (
            <div className="space-y-2">
              {snapshot.bookings.map((booking) => (
                <Link
                  key={booking.id}
                  to={`/bookings/${booking.id}`}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-2 rounded-2xl border border-[#E5DFC6] bg-[#f7f3ea] px-3 py-2 hover:border-[#BFAD72]"
                >
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-semibold">
                      Booking #{booking.id.slice(0, 6)}
                    </p>
                    <p className="text-[10px] text-[#8D8D8D]">
                      Status: {booking.status} · Escrow: {booking.escrow_status || "HELD"}
                    </p>
                    {booking.commission_mode && (
                      <p className="text-[10px] text-[#4a4a4a]">
                        Commission mode: {booking.commission_mode}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <p className="text-[12px] font-semibold">
                      {formatMoney(booking.amount_cents, booking.currency || currency)}
                    </p>
                    <p className="text-[9px] text-[#8D8D8D]">
                      {new Date(booking.created_at).toLocaleDateString()}
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

        <p className="text-[9px] text-[#8D8D8D] max-w-md">
          Goldsainte holds traveler funds for a short protected window before releasing payouts to you and your partners. Need help?
          Reach out via support@goldsainte.com.
        </p>
      </section>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl bg-white/95 border border-[#E5DFC6] p-3 space-y-1.5">
      <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8D8D]">
        {label}
      </p>
      <p className="text-[16px] font-semibold">{value}</p>
      <p className="text-[10px] text-[#4a4a4a]">{description}</p>
    </div>
  );
}
