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
    <div className="space-y-10">
      {/* Stripe Connect setup card — always mounted. The card handles all
          three states itself (not connected / pending "Continue Setup" /
          active), and mounting it is what triggers check-creator-stripe-status,
          which is the only thing that syncs profiles.stripe_charges_enabled —
          the flag the publish gate reads. Hiding it when an account id exists
          left half-finished onboarding with no way to resume. */}
      <CreatorStripeOnboarding />

      {/* Summary cards */}
      <div className="grid gap-x-10 gap-y-6 md:grid-cols-3">
        <SummaryCard
          label="Paid"
          value={snapshot ? formatMoney(snapshot.released, currency) : "—"}
          description="Settled to your account"
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

      {/* Booking payouts */}
      <div className="border-t border-[#0a2225]/15 pt-6 space-y-4">
        <div>
          <p className="text-[14px] uppercase tracking-[0.28em] text-[#8D6B2F]">
            Booking payouts
          </p>
          <p className="font-secondary text-[20px] text-[#0a2225] mt-1.5">
            Latest activity
          </p>
        </div>

        {loading && <p className="text-[16px] text-[#6B7280]">Loading…</p>}
        {error && <p className="text-[16px] text-red-600">{error}</p>}

        {!loading && !error && snapshot && snapshot.bookings.length === 0 && (
          <p className="text-[16px] text-[#6B7280]">
            Once travelers confirm bookings with you, each payout will appear here.
          </p>
        )}

        {!loading && !error && snapshot && snapshot.bookings.length > 0 && (
          <div className="divide-y divide-[#0a2225]/10 border-t border-[#0a2225]/10">
            {snapshot.bookings.map((booking) => (
              <Link
                key={booking.id}
                to={`/bookings/${booking.id}`}
                className="flex flex-col md:flex-row md:items-center justify-between gap-3 py-4 transition-colors hover:bg-[#F6F0E4]/40"
              >
                <div className="space-y-1">
                  <p className="text-[16px] font-semibold text-[#0a2225]">
                    Booking #{booking.id.slice(0, 6)}
                  </p>
                  <p className="text-[14.5px] text-[#6B7280]">
                    Status: {booking.status} · Payout: {booking.payout_status || "pending"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <p className="text-base font-semibold text-[#C7A962]">
                    {formatMoney(booking.amount_cents, booking.currency || currency)}
                  </p>
                  <p className="text-[14.5px] text-[#6B7280]">
                    {new Date(booking.created_at).toLocaleDateString()}
                  </p>
                  <div className="inline-flex items-center gap-1 text-[14.5px] text-[#0c4d47] font-medium">
                    View booking
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <p className="text-[14.5px] text-[#6B7280] max-w-2xl leading-relaxed">
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
    <div className="border-t border-[#0a2225]/15 pt-3">
      <p className="text-[14px] uppercase tracking-[0.18em] text-[#8D6B2F]">
        {label}
      </p>
      <p className={`mt-1.5 font-secondary text-[30px] leading-tight ${
        highlight ? "text-[#0c4d47]" : "text-[#0a2225]"
      }`}>
        {value}
      </p>
      <p className="mt-1 text-[15.5px] text-[#0a2225]/55">
        {description}
      </p>
    </div>
  );
}
