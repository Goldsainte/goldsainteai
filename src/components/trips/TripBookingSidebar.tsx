import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Users, Star, Shield, MessageCircle, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TripBookingSidebarProps {
  tripId: string;
  pricePerPerson: number;
  currency?: string;
  rating?: number;
  reviewCount?: number;
  spotsAvailable?: number;
  depositPercentage?: number;
  hostName?: string;
}

export function TripBookingSidebar({
  tripId,
  pricePerPerson,
  currency = "USD",
  rating,
  reviewCount,
  spotsAvailable,
  depositPercentage = 25,
  hostName,
}: TripBookingSidebarProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleRequestToBook = () => {
    setIsLoading(true);
    // Navigate to booking flow
    navigate(`/marketplace/trip/${tripId}/book`);
  };

  const handleAskQuestion = () => {
    // Open chat or contact modal
    navigate(`/messages?tripId=${tripId}`);
  };

  return (
    <div className="rounded-2xl border border-[#E5DFC6] bg-white p-6 shadow-lg">
      {/* Price */}
      <div className="text-center">
        <p className="text-sm text-[#6B7280]">From</p>
        <p className="font-secondary text-3xl font-bold text-[#0a2225]">
          {formatPrice(pricePerPerson)}
          <span className="text-base font-normal text-[#6B7280]">/person</span>
        </p>
      </div>

      {/* Rating */}
      {rating !== undefined && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <div className="flex items-center gap-1">
            <Star className="h-5 w-5 fill-[#C7B892] text-[#C7B892]" />
            <span className="font-semibold text-[#0a2225]">{rating.toFixed(1)}</span>
          </div>
          {reviewCount !== undefined && (
            <span className="text-sm text-[#6B7280]">
              ({reviewCount} reviews)
            </span>
          )}
        </div>
      )}

      {/* Spots Available */}
      {spotsAvailable !== undefined && spotsAvailable > 0 && (
        <p className="mt-2 text-center text-sm font-medium text-[#0C4D47]">
          Only {spotsAvailable} spots left!
        </p>
      )}

      {/* CTAs */}
      <div className="mt-6 space-y-3">
        <Button
          onClick={handleRequestToBook}
          disabled={isLoading}
          className="w-full bg-[#0C4D47] py-6 text-base font-semibold hover:bg-[#0C4D47]/90"
        >
          Request to Book
        </Button>
        <Button
          variant="outline"
          onClick={handleAskQuestion}
          className="w-full border-[#E5DFC6] py-6 text-base hover:bg-[#FDF9F0]"
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          Ask a Question
        </Button>
      </div>

      {/* Deposit Info */}
      <div className="mt-6 rounded-xl bg-[#FDF9F0] p-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-[#C7B892]" />
          <span className="text-sm font-medium text-[#0a2225]">
            Reserve with {depositPercentage}% deposit
          </span>
        </div>
        <p className="mt-1 text-xs text-[#6B7280]">
          Flexible payment plans available at checkout
        </p>
      </div>

      {/* How It Works */}
      <div className="mt-6 border-t border-[#E5DFC6] pt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#7A7151]">
          How it works
        </p>
        <div className="mt-3 space-y-3">
          {[
            { step: 1, text: "Share your travel details" },
            { step: 2, text: "Get matched with your host" },
            { step: 3, text: "Book securely on Goldsainte" },
          ].map((item) => (
            <div key={item.step} className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0C4D47] text-xs font-semibold text-white">
                {item.step}
              </span>
              <span className="text-sm text-[#4a4a4a]">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="mt-6 border-t border-[#E5DFC6] pt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#7A7151]">
          Trust & Safety
        </p>
        <div className="mt-3 space-y-2">
          {[
            { icon: Shield, text: "Verified host" },
            { icon: CreditCard, text: "Secure payments" },
            { icon: MessageCircle, text: "24/7 support" },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm text-[#4a4a4a]">
              <item.icon className="h-4 w-4 text-[#0C4D47]" />
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
