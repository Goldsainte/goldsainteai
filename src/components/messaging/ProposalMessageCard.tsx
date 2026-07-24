import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ResidenceSelect } from "@/components/compliance/ResidenceSelect";
import { isSotBlockedState } from "@/lib/residency";

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
  /** Trip context from the conversation (e.g. an Ask-a-Question thread) so the
      booking inherits the marketplace trip's cover image + title. */
  tripId?: string | null;
  tripTitle?: string | null;
}

export function ProposalMessageCard({
  message,
  isSelf,
  currentUserId,
  recipientId,
  tripId,
  tripTitle,
}: ProposalMessageCardProps) {
  const [accepting, setAccepting] = useState(false);
  // Paid-state sync: the booking created on acceptance stamps this message's
  // id into its metadata (proposal_message_id). Both parties' cards discover
  // it here and stop offering "Accept and Pay" on proposals already paid —
  // the missing state that made paid proposals look forever-pending.
  const [acceptedBooking, setAcceptedBooking] = useState<{ id: string; status: string } | null>(null);
  useEffect(() => {
    let cancelled = false;
    supabase
      .from("trip_bookings")
      .select("id, status")
      .filter("metadata->>proposal_message_id", "eq", message.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) setAcceptedBooking(data as { id: string; status: string });
      });
    return () => {
      cancelled = true;
    };
  }, [message.id]);
  const [residenceState, setResidenceState] = useState("");
  const meta = message.metadata || {};
  const price: number = Number(meta.price) || 0;
  const depositPct: number = Number(meta.depositPercentage) || 25;
  // Cents-precision: Math.round at whole dollars turned a $2.50 deposit
  // (25% of $10) into $3.00 — a 30% deposit wearing a 25% label.
  const depositAmount = Math.round(price * depositPct) / 100;
  // Canonical guest-side platform fee: 3.5% added on top of the deposit
  // (host-side 3.5% is deducted from payout server-side). 7% total, always.
  const GUEST_FEE_RATE = 0.035;
  const guestServiceFee = Math.round(depositAmount * GUEST_FEE_RATE * 100) / 100;
  const depositTotal = Math.round((depositAmount + guestServiceFee) * 100) / 100;
  const note: string = meta.note || "";

  const handleAccept = async () => {
    // SOT residency gate: enforced server-side in trip-checkout-create.
    if (!residenceState) {
      toast({
        title: "Select your state of residence",
        description: "We need it to process your trip booking.",
        variant: "destructive",
      });
      return;
    }
    if (isSotBlockedState(residenceState)) {
      toast({
        title: "Not yet available in your state",
        description:
          "Trip bookings aren't yet available to residents of California, Florida, Hawaii, Iowa, or Washington.",
        variant: "destructive",
      });
      return;
    }
    setAccepting(true);
    try {
      const { data: booking, error: bookingError } = await supabase
        .from("trip_bookings")
        .insert({
          traveler_id: currentUserId,
          partner_id: message.sender_id, // the agent who proposed
          partner_role: "agent",
          total_price: Math.round(price * 100), // cents — column standard
          deposit_amount: Math.round(depositAmount * 100), // cents
          deposit_percentage: depositPct,
          currency: "USD",
          status: "deposit_pending",
          partner_payout: 0,
          platform_commission: 0,
          metadata: {
            source: "chat_proposal",
            proposal_message_id: message.id,
            // Carry the conversation's trip context so My Bookings and the
            // booking page show the SAME cover photo + title as the
            // marketplace card the traveler fell in love with.
            ...(tripId ? { trip_id: tripId } : {}),
            ...(tripTitle ? { trip_title: tripTitle } : {}),
            guest_service_fee: guestServiceFee,
            guest_service_fee_rate: GUEST_FEE_RATE,
            residence_state: residenceState,
            residence_attested_at: new Date().toISOString(),
          },
        } as any)
        .select("id")
        .single();

      if (bookingError || !booking?.id) {
        throw new Error(bookingError?.message || "Failed to create booking");
      }

      const { data, error } = await supabase.functions.invoke("trip-checkout-create", {
        body: {
          tripBookingId: booking.id,
          amountTotalCents: Math.round(depositTotal * 100),
          currency: "usd",
          residenceState,
          successUrl: `${window.location.origin}/booking-confirmation?booking=${booking.id}`,
          cancelUrl: `${window.location.origin}/messages`,
          affiliateCode:
            (await import("@/hooks/useAffiliateRef")).getActiveAffiliateRef() || undefined,
          gclid:
            (await import("@/lib/analytics/gclid")).getStoredGclid() || undefined,
        },
      });
      if (error) throw error;
      if (!data?.paymentUrl) throw new Error("No checkout URL returned");
      window.location.href = data.paymentUrl;
    } catch (err: any) {
      // Edge-function errors carry the real JSON body on err.context —
      // surface the human message instead of "non-2xx status code".
      let body: any = null;
      try {
        body = await err?.context?.json?.();
      } catch {
        /* no parseable body */
      }
      if (body?.code === "CONTRACT_NOT_EXECUTED") {
        toast({
          title: "One signature to go",
          description:
            "Your trip contract needs to be signed before the deposit. Taking you to it now…",
        });
        if (body.contractId) {
          setTimeout(() => {
            window.location.href = `/contract/${body.contractId}/sign`;
          }, 1400);
        }
      } else {
        toast({
          title: "Couldn't start checkout",
          description: body?.error || body?.message || err.message,
          variant: "destructive",
        });
      }
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
      <p className="text-[12.5px] uppercase tracking-[0.18em] text-[#C7A962] font-medium">
        Trip proposal
      </p>
      <div className="mt-2 flex items-baseline justify-between gap-3">
        <span className="font-secondary text-2xl text-[#0a2225]">
          ${price.toLocaleString()}
        </span>
        <span className="text-xs text-[#5a6c6e]">total</span>
      </div>
      <p className="mt-1 text-sm text-[#0a2225]">
        Deposit: <strong>${depositTotal.toLocaleString()}</strong> ({depositPct}%
        + 3.5% service fee)
      </p>
      {note && (
        <p className="mt-3 text-sm text-[#4a4a4a] whitespace-pre-wrap leading-relaxed">
          {note}
        </p>
      )}
      {acceptedBooking ? (
        <div className="mt-4 rounded-xl bg-[#0c4d47]/[0.06] p-3 text-sm text-[#0c4d47]">
          <span className="font-medium">✓ Deposit paid</span> — this proposal was
          accepted.{" "}
          <a href={`/bookings/${acceptedBooking.id}`} className="underline">
            View booking
          </a>
        </div>
      ) : !isSelf && (
        <div className="mt-4 space-y-3">
          <ResidenceSelect
            value={residenceState}
            onChange={setResidenceState}
            compact
            id="proposal-residence-state"
          />
          <Button
            onClick={handleAccept}
            disabled={accepting || isSotBlockedState(residenceState)}
            className="w-full bg-[#0c4d47] hover:bg-[#0c4d47]/90 text-white"
          >
            {accepting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Accept and Pay Deposit"
            )}
          </Button>
        </div>
      )}
      {isSelf && (
        <p className="mt-3 text-[12.5px] text-[#9CA3AF] italic">
          Awaiting traveler response
        </p>
      )}
    </div>
  );
}
