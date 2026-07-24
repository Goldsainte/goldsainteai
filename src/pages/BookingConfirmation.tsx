import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Clock, AlertCircle, ArrowRight } from "lucide-react";
import { trackPurchaseConversionOnce } from "@/lib/analytics/conversions";

export default function BookingConfirmation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get("booking");
  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const conversionFired = useRef(false);

  useEffect(() => {
    if (!bookingId) {
      navigate("/marketplace");
      return;
    }
    let cancelled = false;
    let attempts = 0;
    const PENDING = new Set([
      "pending",
      "processing",
      "payment_pending",
      "deposit_pending",
      "requires_action",
      "requires_confirmation",
    ]);

    const fetchBooking = async () => {
      const { data } = await supabase
        .from("trip_bookings")
        .select(
          "id, total_price, deposit_amount, deposit_percentage, currency, status, metadata, created_at"
        )
        .eq("id", bookingId)
        .single();
      if (cancelled) return;
      setBooking(data);
      setIsLoading(false);
      // Poll until the webhook flips status out of a pending state.
      // Max ~60s (30 * 2s) — covers typical Stripe webhook + 3DS latency.
      if (data && PENDING.has(data.status) && attempts < 30) {
        attempts += 1;
        setTimeout(fetchBooking, 2000);
      }
    };
    fetchBooking();

    // Realtime fallback in case the webhook is faster than the next poll tick.
    const channel = supabase
      .channel(`booking-${bookingId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "trip_bookings",
          filter: `id=eq.${bookingId}`,
        },
        (payload) => {
          if (!cancelled && payload.new) setBooking(payload.new);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [bookingId, navigate]);

  // Fire Google Ads purchase conversion once per booking when the booking is
  // considered paid (status confirmed or completed, or any deposit captured).
  useEffect(() => {
    if (!booking || conversionFired.current) return;
    const paidStatuses = ["confirmed", "completed", "deposit_paid", "paid"];
    const isPaid = paidStatuses.includes(booking.status);
    const value =
      Number(booking.deposit_amount) ||
      Number(booking.total_price) ||
      0;
    if (isPaid && value > 0) {
      trackPurchaseConversionOnce(booking.id, {
        value,
        currency: booking.currency || "USD",
        transactionId: booking.id,
        productType: "trip_booking",
      });
      conversionFired.current = true;
    }
  }, [booking]);

  const bookingRef = booking?.id ? `GS-${booking.id.slice(0, 8).toUpperCase()}` : "";

  // trip_bookings money columns are INTEGER CENTS (the column standard) —
  // this formatter converts to dollars exactly once. Rendering the raw cents
  // as dollars is what turned a $10 trip into "$1,000.00" on this page.
  const fmtCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount / 100);

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f7f3ea]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0c4d47]" />
      </main>
    );
  }

  if (
    booking &&
    (booking.status === "deposit_pending" || booking.status === "payment_pending")
  ) {
    return (
      <main className="min-h-screen bg-[#f7f3ea] px-4 sm:px-6 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-8 bg-[#FDF9F0] border border-[#C7A962]/30">
            <Clock className="h-10 w-10 text-[#c7a962]" />
          </div>
          <h1 className="font-secondary text-3xl sm:text-4xl md:text-5xl leading-[1.1] text-[#0a2225] mb-4">
            Almost there
          </h1>
          <p className="text-base text-[#0a2225]/70 leading-relaxed max-w-xl mx-auto mb-10">
            Your payment is being processed. We'll email you the moment it's
            confirmed — usually within a few minutes.
          </p>
          <button
            onClick={() => navigate("/my-trips")}
            className="rounded-full bg-[#0c4d47] hover:bg-[#0a3d39] text-white px-7 h-12 text-sm font-medium transition-colors"
          >
            View My Trips
          </button>
        </div>
      </main>
    );
  }

  if (
    booking &&
    (booking.status === "payment_failed" || booking.status === "cancelled")
  ) {
    return (
      <main className="min-h-screen bg-[#f7f3ea] px-4 sm:px-6 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-8 bg-[#FDECEC] border border-[#C24545]/30">
            <AlertCircle className="h-10 w-10 text-[#C24545]" />
          </div>
          <h1 className="font-secondary text-3xl sm:text-4xl md:text-5xl leading-[1.1] text-[#0a2225] mb-4">
            Payment didn't go through
          </h1>
          <p className="text-base text-[#0a2225]/70 leading-relaxed max-w-xl mx-auto mb-10">
            We weren't able to complete your payment. Your card was not charged.
            Try again or contact our team.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="rounded-full bg-[#0c4d47] hover:bg-[#0a3d39] text-white px-7 h-12 text-sm font-medium transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => (window.location.href = "mailto:info@goldsainte.com")}
              className="rounded-full border border-[#E5DFC6] text-[#0a2225] px-7 h-12 text-sm font-medium"
            >
              Contact Support
            </button>
          </div>
        </div>
      </main>
    );
  }

  const balanceDue =
    booking?.total_price && booking?.deposit_amount
      ? booking.total_price - booking.deposit_amount
      : null;

  const balanceDueText =
    balanceDue !== null
      ? fmtCurrency(balanceDue, booking.currency)
      : "Remaining balance";

  const metaRows = [
    { label: "Booking Reference", value: bookingRef },
    {
      label: "Trip Total",
      value: booking?.total_price
        ? fmtCurrency(booking.total_price, booking.currency)
        : "—",
    },
    {
      label: booking?.deposit_percentage
        ? `Deposit Paid (${booking.deposit_percentage}%)`
        : "Deposit Paid",
      value: booking?.deposit_amount
        ? fmtCurrency(booking.deposit_amount, booking.currency)
        : "—",
    },
    {
      label: "Balance Due",
      value: balanceDueText,
    },
    {
      label: "Status",
      value:
        (
          { confirmed: "Confirmed", completed: "Completed", deposit_paid: "Deposit Paid", paid: "Paid", paid_in_full: "Paid in Full" } as Record<string, string>
        )[booking?.status] || "Confirmed",
    },
  ];

  const nextSteps = [
    "Your specialist will contact you within 24 hours to confirm trip details.",
    `Your balance of ${balanceDueText} is due before departure.`,
    "Your itinerary is saved in your dashboard.",
    "Your payment goes directly to your specialist — your seller of record for this trip.",
    "You can message your specialist anytime from your bookings dashboard.",
  ];

  return (
    <main className="min-h-screen bg-[#f7f3ea] px-4 sm:px-6 pt-16 md:pt-24 pb-20 md:pb-28">
      <div className="max-w-4xl mx-auto">
        {/* Headline */}
        <h1 className="font-secondary text-3xl sm:text-4xl md:text-6xl leading-[1.08] tracking-tight text-[#0a2225] mb-4">
          Your trip is confirmed
        </h1>

        {/* Subhead */}
        <p className="font-secondary italic text-base md:text-lg text-[#0a2225]/60 font-light leading-relaxed max-w-2xl mb-8">
          Every detail has been arranged. We wish you an extraordinary journey.
        </p>

        {/* Dark green rule */}
        <div className="w-full h-px bg-[#0a2225] mb-10" />

        {/* Two-column metadata block */}
        <div className="mb-14">
          {metaRows.map((row, i) => (
            <div
              key={row.label}
              className={`grid grid-cols-2 items-baseline py-3 ${
                i < metaRows.length - 1 ? "border-b border-[#E5DFC6]" : ""
              }`}
            >
              <span className="text-xs uppercase tracking-[0.18em] text-[#0a2225]/50">
                {row.label}
              </span>
              <span className="text-right text-sm font-medium text-[#0a2225]">
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* What happens next */}
        <div className="mb-16">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#C7A962] mb-6">
            What happens next
          </p>
          <ol className="space-y-4">
            {nextSteps.map((step, i) => {
              const roman = ["I.", "II.", "III.", "IV.", "V."][i];
              return (
                <li key={i} className="flex items-start gap-4">
                  <span className="flex-shrink-0 font-secondary text-sm text-[#7A7151] mt-0.5 w-6">
                    {roman}
                  </span>
                  <p className="text-base text-[#0a2225]/75 leading-relaxed">
                    {step}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Review prompt (if completed) */}
        {booking?.status === "completed" && (
          <div className="border border-[#C7A962]/30 bg-[#FDF9F0] p-6 md:p-8 mb-12">
            <h2 className="font-secondary text-xl md:text-2xl text-[#0a2225] mb-2">
              How was your trip?
            </h2>
            <p className="text-sm text-[#0a2225]/60 leading-relaxed mb-5">
              Your review helps other travelers and rewards outstanding
              specialists.
            </p>
            <button
              onClick={() => navigate(`/reviews/new?booking_id=${booking.id}`)}
              className="rounded-full bg-[#0c4d47] text-white px-6 py-2.5 text-sm font-medium"
            >
              Leave a Review
            </button>
          </div>
        )}

        {/* CTAs */}
        <div className="space-y-4">
          <button
            onClick={() => navigate("/my-bookings")}
            className="w-full h-12 rounded-full text-sm font-medium flex items-center justify-center gap-2 bg-[#0c4d47] text-[#E5DFC6] hover:bg-[#0a3d39] transition-colors"
          >
            View My Booking <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => navigate("/marketplace")}
            className="w-full text-center text-sm text-[#0a2225]/60 hover:text-[#0c4d47] transition-colors underline underline-offset-4 decoration-[#E5DFC6] hover:decoration-[#0c4d47]"
          >
            Return to marketplace
          </button>
        </div>
      </div>
    </main>
  );
}
