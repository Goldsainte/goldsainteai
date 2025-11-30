import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, CreditCard, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface TripBookingCardProps {
  trip: {
    id: string;
    title: string;
    price_per_person: number;
    currency: string;
    original_price: number | null;
    deposit_percentage: number | null;
    max_participants: number;
    current_bookings: number | null;
    available_from: string | null;
  };
  spotsLeft: number;
  depositAmount: number;
}

export function TripBookingCard({ trip, spotsLeft, depositAmount }: TripBookingCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: trip.currency || "USD",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const hasDiscount = trip.original_price && trip.original_price > trip.price_per_person;
  const discountPercent = hasDiscount
    ? Math.round(((trip.original_price! - trip.price_per_person) / trip.original_price!) * 100)
    : 0;

  const handleBookTrip = async () => {
    if (!user) {
      toast.info("Please sign in to book this trip");
      navigate("/auth?redirect=" + encodeURIComponent(window.location.pathname));
      return;
    }

    if (spotsLeft <= 0) {
      toast.error("Sorry, this trip is fully booked");
      return;
    }

    setIsLoading(true);
    try {
      // Navigate to booking flow (you can implement checkout later)
      navigate(`/book/${trip.id}`);
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#E5DFC6] bg-white p-6 shadow-lg">
      {/* Price Section */}
      <div className="border-b border-[#E5DFC6]/50 pb-4">
        <div className="flex items-baseline gap-2">
          <span className="font-secondary text-3xl font-semibold text-[#0a2225]">
            {formatPrice(trip.price_per_person)}
          </span>
          <span className="text-[15px] text-[#4a4a4a]">/ person</span>
        </div>
        
        {hasDiscount && (
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[14px] text-[#818181] line-through">
              {formatPrice(trip.original_price!)}
            </span>
            <span className="rounded bg-[#0C4D47]/10 px-2 py-0.5 text-[12px] font-medium text-[#0C4D47]">
              Save {discountPercent}%
            </span>
          </div>
        )}
      </div>

      {/* Deposit Info */}
      <div className="border-b border-[#E5DFC6]/50 py-4">
        <div className="flex items-center gap-2 text-[14px] text-[#4a4a4a]">
          <CreditCard className="h-4 w-4 text-[#818181]" />
          <span>
            Deposit: <span className="font-medium text-[#0a2225]">{formatPrice(depositAmount)}</span>
            <span className="text-[#818181]"> ({trip.deposit_percentage || 30}%)</span>
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-[14px] text-[#4a4a4a]">
          <Calendar className="h-4 w-4 text-[#818181]" />
          <span>Balance due 60 days before departure</span>
        </div>
      </div>

      {/* Spots Remaining */}
      <div className="py-4">
        {spotsLeft > 0 ? (
          <div className="text-center">
            <span className={`text-[14px] font-medium ${spotsLeft <= 3 ? "text-[#C7B892]" : "text-[#4a4a4a]"}`}>
              {spotsLeft} {spotsLeft === 1 ? "spot" : "spots"} remaining
            </span>
            {/* Progress bar */}
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#E5DFC6]/50">
              <div
                className="h-full rounded-full bg-[#C7B892] transition-all"
                style={{ width: `${((trip.max_participants - spotsLeft) / trip.max_participants) * 100}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="text-center text-[14px] font-medium text-[#818181]">
            This trip is fully booked
          </p>
        )}
      </div>

      {/* Book Button */}
      <button
        onClick={handleBookTrip}
        disabled={isLoading || spotsLeft <= 0}
        className="w-full rounded-full bg-[#0C4D47] py-3.5 text-[15px] font-semibold text-[#E5DFC6] transition-colors hover:bg-[#0a3d39] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? "Loading..." : spotsLeft <= 0 ? "Join Waitlist" : "Book This Trip"}
      </button>

      {/* Trust Badge */}
      <div className="mt-4 flex items-center justify-center gap-2 text-[12px] text-[#818181]">
        <Shield className="h-4 w-4" />
        <span>Secure checkout · Free cancellation policy</span>
      </div>
    </div>
  );
}
