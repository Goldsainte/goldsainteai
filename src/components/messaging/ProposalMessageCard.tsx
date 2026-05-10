import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ProposalMessageCardProps {
  message: {
    id: string;
    sender_id: string;
    body: string;
    metadata?: any;
  };
  isSelf: boolean;
  currentUserId: string;
  recipientId: string; // the other participant (the agent who sent it, when traveler views)
}

export function ProposalMessageCard({
  message,
  isSelf,
  currentUserId,
  recipientId,
}: ProposalMessageCardProps) {
  const [accepting, setAccepting] = useState(false);
  const meta = message.metadata || {};
  const price: number = Number(meta.price) || 0;
  const depositPct: number = Number(meta.depositPercentage) || 25;
  const depositAmount = Math.round(price * (depositPct / 100));
  const note: string = meta.note || "";

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const { data: booking, error: bookingError } = await supabase
        .from("trip_bookings")
        .insert({
          traveler_id: currentUserId,
          partner_id: message.sender_id, // the agent who proposed
          partner_role: "agent",
          total_price: price,
          deposit_amount: depositAmount,
          deposit_percentage: depositPct,
          currency: "USD",
          status: "deposit_pending",
          partner_payout: 0,
          platform_commission: 0,
          metadata: { source: "chat_proposal", proposal_message_id: message.id },
        } as any)
        .select("id")
        .single();

      if (bookingError || !booking?.id) {
        throw new Error(bookingError?.message || "Failed to create booking");
      }

      const { data, error } = await supabase.functions.invoke("trip-checkout-create", {
        body: {
          tripBookingId: booking.id,
          amountTotalCents: depositAmount * 100,
          currency: "usd",
          successUrl: `${window.location.origin}/booking-confirmation?booking=${booking.id}`,
          cancelUrl: `${window.location.origin}/messages`,
        },
      });
      if (error) throw error;
      if (!data?.paymentUrl) throw new Error("No checkout URL returned");
      window.location.href = data.paymentUrl;
    } catch (err: any) {
      toast({
        title: "Couldn't start checkout",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div
      className={`max-w-[85%] rounded-2xl border border-[#C7A962]/40 bg-white p-4 shadow-sm ${
        isSelf ? "ml-auto" : ""
      }`}
    >
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#C7A962] font-medium">
        Trip proposal
      </p>
      <div className="mt-2 flex items-baseline justify-between gap-3">
        <span className="font-secondary text-2xl text-[#0a2225]">
          ${price.toLocaleString()}
        </span>
        <span className="text-xs text-[#5a6c6e]">total</span>
      </div>
      <p className="mt-1 text-sm text-[#0a2225]">
        Deposit: <strong>${depositAmount.toLocaleString()}</strong> ({depositPct}%)
      </p>
      {note && (
        <p className="mt-3 text-sm text-[#4a4a4a] whitespace-pre-wrap leading-relaxed">
          {note}
        </p>
      )}
      {!isSelf && (
        <Button
          onClick={handleAccept}
          disabled={accepting}
          className="mt-4 w-full bg-[#0c4d47] hover:bg-[#0c4d47]/90 text-white"
        >
          {accepting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Accept and Pay Deposit"
          )}
        </Button>
      )}
      {isSelf && (
        <p className="mt-3 text-[11px] text-[#9CA3AF] italic">
          Awaiting traveler response
        </p>
      )}
    </div>
  );
}