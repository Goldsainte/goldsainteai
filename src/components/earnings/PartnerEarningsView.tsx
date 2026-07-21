import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Wallet } from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";
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
    <main className="min-h-screen bg-[#FDF9F0] text-[#0a2225]">
      <section className="mx-auto max-w-5xl px-4 pt-14 pb-6 md:pt-16 md:pb-8">
        <div className="mb-6">
          <BackButton to={backLink} label={backLabel} />
        </div>
        
        <div className="w-16 h-0.5 bg-[#C7A962] mb-6" />
        
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 border border-[#E5DFC6]">
              <Wallet className="h-4 w-4 text-[#C7A962]" />
              <span className="text-sm font-medium text-[#6B7280] tracking-wide">
                Earnings
              </span>
            </div>
            <h1 className="font-secondary text-2xl md:text-3xl leading-tight text-[#0a2225]">
              {title}
            </h1>
            <p className="text-sm text-[#6B7280] max-w-xl leading-relaxed">
              {intro}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-[#6B7280]">
            <Wallet className="h-4 w-4 text-[#0c4d47]" />
            <span>Payments are charged directly to your Stripe account at booking.</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16 md:pb-20 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard 
            label="Released" 
            value={snapshot ? formatMoney(snapshot.released, currency) : "—"} 
            description="Already paid out" 
          />
          <SummaryCard 
            label="Pending" 
            value={snapshot ? formatMoney(snapshot.pending, currency) : "—"} 
            description="Processing or awaiting release" 
          />
          <SummaryCard 
            label="Lifetime" 
            value={snapshot ? formatMoney(total, currency) : "—"} 
            description="Total earned" 
            highlight
          />
        </div>

        <div className="rounded-2xl bg-white border border-[#E5DFC6] p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] font-medium text-[#C7A962]">
                Booking payouts
              </p>
              <p className="text-base font-secondary font-semibold text-[#0a2225] mt-1">
                Latest activity
              </p>
            </div>
          </div>

          {loading && <p className="text-sm text-[#6B7280]">Loading…</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {!loading && !error && snapshot && snapshot.bookings.length === 0 && (
            <p className="text-sm text-[#6B7280]">
              Once travelers confirm bookings with you, each payout will appear here.
            </p>
          )}

          {!loading && !error && snapshot && snapshot.bookings.length > 0 && (
            <div className="space-y-3">
              {snapshot.bookings.map((booking) => (
                <Link
                  key={booking.id}
                  to={`/bookings/${booking.id}`}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-xl border border-[#E5DFC6] bg-[#FDF9F0] px-4 py-3 hover:border-[#C7A962] transition-colors"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-[#0a2225]">
                      Booking #{booking.id.slice(0, 6)}
                    </p>
                    <p className="text-xs text-[#6B7280]">
                      Status: {booking.status} · Payout: {booking.payout_status || "pending"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <p className="text-base font-semibold text-[#C7A962]">
                      {formatMoney(booking.amount_cents, booking.currency || currency)}
                    </p>
                    <p className="text-xs text-[#6B7280]">
                      {new Date(booking.created_at).toLocaleDateString()}
                    </p>
                    <div className="inline-flex items-center gap-1 text-xs text-[#0c4d47] font-medium">
                      View booking
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-[#6B7280] max-w-2xl leading-relaxed">
          Traveler payments are charged directly to your own Stripe account at checkout — you are the seller of record and keep 96.5%, with Goldsainte's flat 3.5% applied per side. Need help? Reach out via support@goldsainte.com.
        </p>
      </section>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  description,
  highlight = false,
}: {
  label: string;
  value: string;
  description: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-4 space-y-2 ${
      highlight 
        ? "bg-[#0c4d47] border-[#0c4d47] text-white" 
        : "bg-white border-[#E5DFC6]"
    }`}>
      <p className={`text-xs uppercase tracking-[0.15em] font-medium ${
        highlight ? "text-white/70" : "text-[#6B7280]"
      }`}>
        {label}
      </p>
      <p className={`text-xl font-secondary font-semibold ${
        highlight ? "text-white" : "text-[#C7A962]"
      }`}>
        {value}
      </p>
      <p className={`text-xs ${
        highlight ? "text-white/70" : "text-[#6B7280]"
      }`}>
        {description}
      </p>
    </div>
  );
}
