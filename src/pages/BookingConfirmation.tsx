import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import logomark from "@/assets/logomark-gold.png";

export default function BookingConfirmation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get("booking");
  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) {
      navigate("/marketplace");
      return;
    }
    const fetchBooking = async () => {
      const { data } = await supabase
        .from("trip_bookings")
        .select("id, total_price, deposit_amount, deposit_percentage, currency, status, metadata, created_at")
        .eq("id", bookingId)
        .single();
      setBooking(data);
      setIsLoading(false);
    };
    fetchBooking();
  }, [bookingId, navigate]);

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f7f3ea]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0c4d47]" />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#f7f3ea]">
      <div className="w-full max-w-xl">
        <img src={logomark} alt="Goldsainte" className="h-16 w-16 mx-auto mb-8" loading="lazy"/>
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 bg-[#0c4d47]">
            <CheckCircle2 className="h-12 w-12 text-[#E5DFC6]" />
          </div>
          <h1 className="font-secondary text-4xl mb-3 text-[#0a2225]">
            Booking Confirmed
          </h1>
          <p className="text-base text-[#4a4a4a]">
            Your booking is confirmed. Your travel specialist will be in touch within 24 hours.
          </p>
        </div>

        {booking && (
          <div className="rounded-2xl border bg-white p-6 mb-8 space-y-4 border-[#E5DFC6]">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#7A7151]">Booking Reference</span>
              <span className="font-mono text-sm font-semibold text-[#0a2225]">
                {booking.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
            {booking.total_price && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#7A7151]">Trip Total</span>
                  <span className="text-sm font-semibold text-[#0a2225]">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: booking.currency || "USD",
                    }).format(booking.total_price)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#7A7151]">Deposit Paid ({booking.deposit_percentage}%)</span>
                  <span className="text-sm font-semibold text-[#0a2225]">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: booking.currency || "USD",
                    }).format(booking.deposit_amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#7A7151]">Balance Due at Trip</span>
                  <span className="text-sm font-semibold text-[#0a2225]">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: booking.currency || "USD",
                    }).format(booking.total_price - booking.deposit_amount)}
                  </span>
                </div>
              </>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#7A7151]">Status</span>
              <span className="text-sm font-semibold text-[#0c4d47]">Confirmed</span>
            </div>
          </div>
        )}

        {booking && (
          <div className="rounded-2xl border bg-white p-6 mb-8 border-[#E5DFC6]">
            <h3 className="font-secondary text-xl text-[#0a2225] mb-4">What happens next</h3>
            <ol className="space-y-4">
              {[
                { n: 1, text: "Your specialist will contact you within 24 hours to confirm trip details." },
                {
                  n: 2,
                  text: `Your balance of ${
                    booking?.total_price && booking?.deposit_amount
                      ? `$${(booking.total_price - booking.deposit_amount).toLocaleString()}`
                      : "the remaining amount"
                  } is due ${
                    booking?.metadata?.balance_due_days
                      ? `${booking.metadata.balance_due_days} days before departure`
                      : "before departure"
                  }.`,
                },
                { n: 3, text: "You can message your specialist directly from your bookings dashboard." },
              ].map((step) => (
                <li key={step.n} className="flex gap-3">
                  <span className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-[#0c4d47] text-xs font-semibold text-[#E5DFC6]">
                    {step.n}
                  </span>
                  <p className="text-sm text-[#0a2225] leading-relaxed pt-0.5">{step.text}</p>
                </li>
              ))}
            </ol>
            <button
              onClick={() => navigate(`/my-bookings`)}
              className="mt-5 text-sm text-[#0c4d47] underline-offset-2 hover:underline"
            >
              Message your specialist →
            </button>
          </div>
        )}

        {booking?.status === 'completed' && (
          <div className="rounded-2xl border border-[#C7A962]/30 bg-[#FDF9F0] p-6 mb-8">
            <h3 className="font-secondary text-xl text-[#0a2225] mb-1">How was your trip?</h3>
            <p className="text-sm text-[#6B7280] mb-4">Your review helps other travelers and rewards outstanding specialists.</p>
            <button
              onClick={() => navigate(`/reviews/new?booking_id=${booking.id}`)}
              className="rounded-full bg-[#0c4d47] text-white px-5 py-2 text-xs"
            >
              Leave a Review
            </button>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => navigate("/my-bookings")}
            className="w-full h-12 rounded-full text-sm font-medium flex items-center justify-center gap-2 bg-[#0c4d47] text-[#E5DFC6]"
          >
            View My Bookings <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => navigate("/marketplace")}
            className="w-full h-12 rounded-full text-sm font-medium border border-[#E5DFC6] text-[#0a2225]"
          >
            Continue Exploring
          </button>
        </div>
      </div>
    </main>
  );
}