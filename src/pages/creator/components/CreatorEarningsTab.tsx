import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, AlertCircle } from "lucide-react";
import {
  getPartnerBookingEarnings,
  type PartnerEarningSnapshot,
} from "@/services/earningsService";
import { CreatorStripeOnboarding } from "@/components/CreatorStripeOnboarding";

function formatMoney(amountCents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

export function CreatorEarningsTab() {
  const [snapshot, setSnapshot] = useState<PartnerEarningSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getPartnerBookingEarnings("creator");
        if (!cancelled) setSnapshot(data);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load earnings.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const currency = snapshot?.currency || "USD";
  const total = (snapshot?.pending || 0) + (snapshot?.released || 0);

  return (
    <div className="space-y-6">
      {/* Stripe Connect setup card — always mounted. The card handles all
          three states itself (not connected / pending "Continue Setup" /
          active), and mounting it is what triggers check-creator-stripe-status,
          which is the only thing that syncs profiles.stripe_charges_enabled —
          the flag the publish gate reads. Hiding it when an account id exists
          left half-finished onboarding with no way to resume. */}
      <CreatorStripeOnboarding />

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          label="Released"
          value={snapshot ? formatMoney(snapshot.released, currency) : "—"}
          description="Already paid out"
        />
        <SummaryCard
          label="Held in escrow"
          value={snapshot ? formatMoney(snapshot.pending, currency) : "—"}
          description="Awaiting milestone"
        />
        <SummaryCard
          label="Lifetime"
          value={snapshot ? formatMoney(total, currency) : "—"}
          description="Total earned"
          highlight
        />
      </div>

      {/* Booking payouts */}
      <div className="rounded-2xl bg-white border border-[#E5DFC6] p-5 md:p-6 space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] font-medium text-[#C7A962]">
            Booking payouts
          </p>
          <p className="text-base font-secondary font-semibold text-[#0a2225] mt-1">
            Latest activity
          </p>
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
        Goldsainte holds traveler funds for a short protected window before releasing payouts to you and your partners. Need help? Reach out via support@goldsainte.com.
      </p>
    </div>
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
