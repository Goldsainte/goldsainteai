import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Shield, MessageCircle, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TripBookingSidebarProps {
  tripId: string;
  pricePerPerson: number;
  currency?: string;
  rating?: number;
  reviewCount?: number;
  spotsAvailable?: number;
  depositPercentage?: number;
  hostName?: string;
  creatorId?: string;
  creatorType?: string;
  agentId?: string;
  tripTitle?: string;
  instantBooking?: boolean;
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
  creatorId,
  creatorType,
  agentId,
  tripTitle,
  instantBooking = false,
}: TripBookingSidebarProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isAskLoading, setIsAskLoading] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const isPlatformTrip = creatorType === "platform" && !agentId && !creatorId;
  const partnerId = agentId || creatorId;
  const partnerRole = agentId ? "agent" : (creatorType || "creator");

  const handleRequestToBook = async () => {
    if (!user) {
      navigate(`/auth?redirect=/marketplace/trip/${tripId}`);
      return;
    }

    const spotsLeft = spotsAvailable ?? Infinity;
    if (spotsLeft <= 0) {
      toast.error("Sorry, this trip is fully booked.");
      return;
    }

    if (!pricePerPerson || pricePerPerson <= 0) {
      toast.error("Trip price is not available. Please contact support.");
      return;
    }

    setIsLoading(true);
    try {
      const depositAmount = Math.round(pricePerPerson * (depositPercentage / 100));
      const amountCents = Math.round(depositAmount * 100);
      const resolvedPartnerId = agentId || creatorId || null;

      const { data: booking, error: bookingError } = await supabase
        .from("trip_bookings")
        .insert({
          traveler_id: user.id,
          partner_id: resolvedPartnerId,
          partner_role: agentId ? "agent" : "creator",
          total_price: pricePerPerson,
          deposit_amount: depositAmount,
          deposit_percentage: depositPercentage,
          currency: currency || "USD",
          status: "deposit_pending",
          partner_payout: 0,
          platform_commission: 0,
          metadata: { trip_id: tripId, source: "marketplace_booking" },
        } as any)
        .select("id")
        .single();

      if (bookingError || !booking?.id) {
        throw new Error(bookingError?.message || "Failed to create booking record");
      }

      const { data, error } = await supabase.functions.invoke("trip-checkout-create", {
        body: {
          tripBookingId: booking.id,
          amountTotalCents: amountCents,
          currency: (currency || "USD").toLowerCase(),
          successUrl: `${window.location.origin}/booking-confirmation?booking=${booking.id}`,
          cancelUrl: `${window.location.origin}/marketplace/trip/${tripId}`,
          affiliateCode:
            (await import("@/hooks/useAffiliateRef")).getActiveAffiliateRef() || undefined,
          gclid:
            (await import("@/lib/analytics/gclid")).getStoredGclid() || undefined,
        },
      });

      if (error) throw error;
      if (!data?.paymentUrl) throw new Error("No checkout URL returned from payment processor");

      window.location.href = data.paymentUrl;
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!user) {
      navigate(`/auth?redirect=/marketplace/trip/${tripId}`);
      return;
    }

    if (isPlatformTrip) {
      toast.success("Our concierge team will get back to you shortly!");
      navigate("/messages");
      return;
    }

    if (!partnerId) {
      toast.error("Unable to contact host. Host information is missing.");
      return;
    }

    setIsAskLoading(true);
    try {
      // Check for existing conversation
      const { data: existing } = await supabase
        .from("user_conversations")
        .select("id")
        .eq("customer_id", user.id)
        .eq("agent_id", partnerId)
        .limit(1)
        .maybeSingle();

      let conversationId = existing?.id;

      if (!conversationId) {
        // Create new conversation
        const { data: newConvo, error: convoError } = await supabase
          .from("user_conversations")
          .insert({
            customer_id: user.id,
            agent_id: partnerId,
            conversation_type: "trip_inquiry",
            status: "active",
            trip_id: tripId,
            trip_title: tripTitle ?? null,
          })
          .select("id")
          .single();

        if (convoError) throw convoError;
        conversationId = newConvo.id;

        // Send initial message
        await supabase.from("conversation_messages").insert([{
          conversation_id: conversationId,
          sender_id: user.id,
          sender_type: "customer",
          message_text: `Hi! I have a question about your trip${hostName ? ` hosted by ${hostName}` : ""}. Could you tell me more?`,
        }]);
      }

      navigate(`/messages?conversation=${conversationId}`);
    } catch (err: any) {
      console.error("Ask question error:", err);
      toast.error("Failed to start conversation. Please try again.");
    } finally {
      setIsAskLoading(false);
    }
  };

  const displayHostName = isPlatformTrip ? "Goldsainte Concierge" : (hostName || "your host");

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
          className="w-full rounded-full bg-[#0C4D47] py-6 text-base font-semibold hover:bg-[#0C4D47]/90"
        >
          {isLoading ? "Sending..." : (instantBooking ? "Book Instantly" : "Reserve with Deposit")}
        </Button>
        <Button
          variant="outline"
          onClick={handleAskQuestion}
          disabled={isAskLoading}
          className="w-full rounded-full border-[#E5DFC6] py-6 text-base hover:bg-[#FDF9F0]"
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          {isAskLoading ? "Opening..." : "Ask a Question"}
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
            { step: 1, text: "Select your dates and group size" },
            { step: 2, text: `Request to book with ${displayHostName}` },
            { step: 3, text: "Pay securely through Goldsainte" },
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
            { icon: Shield, text: isPlatformTrip ? "Goldsainte Select" : "Verified host" },
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
