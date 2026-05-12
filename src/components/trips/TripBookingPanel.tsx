import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

type BookingStatus =
  | "draft"
  | "payment_pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "disputed"
  | "refunded";

interface TripBooking {
  id: string;
  status: BookingStatus;
  total_price: number;
  currency: string;
  payment_url?: string | null;
  platform_commission?: number;
  partner_payout?: number;
}

interface TripBookingPanelProps {
  tripRequestId: string;
  booking: TripBooking | null;
  acceptedAt?: string | null;
  onBookingUpdated?: (booking: TripBooking) => void;
}

export function TripBookingPanel({
  tripRequestId,
  booking,
  acceptedAt,
  onBookingUpdated,
}: TripBookingPanelProps) {
  const [amount, setAmount] = useState(
    booking?.total_price ? (booking.total_price / 100).toFixed(2) : ""
  );
  const [currency, setCurrency] = useState(booking?.currency ?? "usd");
  const [creating, setCreating] = useState(false);

  const handleCreateLink = async () => {
    const valueNum = Number(amount.replace(/[^\d.]/g, ""));
    if (!valueNum || valueNum <= 0) return;

    setCreating(true);
    try {
      let bookingId = booking?.id;

      // Ensure booking record exists
      if (!bookingId) {
        const { data, error } = await supabase
          .from("trip_bookings")
          .insert([{
            trip_request_id: tripRequestId,
            status: "draft",
            currency: currency.toLowerCase(),
            total_price: 0,
          }] as any)
          .select("id, status, total_price, currency, payment_url, platform_commission, partner_payout")
          .single();

        if (error || !data) throw error;
        bookingId = data.id as string;
        onBookingUpdated?.(data as TripBooking);
      }

      const amountTotalCents = Math.round(valueNum * 100);

      // Call edge function to create Stripe Checkout session
      const { data: result, error: fnError } = await supabase.functions.invoke(
        "trip-checkout-create",
        {
          body: {
            tripBookingId: bookingId,
            amountTotalCents,
            currency: currency.toLowerCase(),
            affiliateCode:
              (await import("@/hooks/useAffiliateRef")).getActiveAffiliateRef() || undefined,
          },
        }
      );

      if (fnError) throw fnError;
      if (!result) throw new Error("No result from checkout function");

      // Calculate commission split for display (3.5% platform host fee)
      const platformCommission = Math.round(amountTotalCents * 0.035);
      const partnerPayout = amountTotalCents - platformCommission;

      const updated: TripBooking = {
        id: bookingId,
        status: result.status as BookingStatus,
        total_price: amountTotalCents,
        currency: currency.toLowerCase(),
        payment_url: result.paymentUrl,
        platform_commission: platformCommission,
        partner_payout: partnerPayout,
      };

      onBookingUpdated?.(updated);
    } catch (err) {
      console.error("Failed to create payment link", err);
    } finally {
      setCreating(false);
    }
  };

  const formatCurrency = (cents: number, curr: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: curr.toUpperCase(),
    }).format(cents / 100);
  };

  const statusLabel: Record<BookingStatus, string> = {
    draft: "Draft",
    payment_pending: "Payment pending",
    confirmed: "Confirmed",
    in_progress: "In progress",
    completed: "Completed",
    cancelled: "Cancelled",
    disputed: "Disputed",
    refunded: "Refunded",
  };

  const statusColor: Record<BookingStatus, string> = {
    draft: "bg-slate-50 text-slate-800 border-slate-200",
    payment_pending: "bg-amber-50 text-amber-800 border-amber-200",
    confirmed: "bg-emerald-50 text-emerald-800 border-emerald-200",
    in_progress: "bg-[#F0F7F6] text-[#0c4d47] border-[#0c4d47]/20",
    completed: "bg-green-50 text-green-800 border-green-200",
    cancelled: "bg-red-50 text-red-800 border-red-200",
    disputed: "bg-orange-50 text-orange-800 border-orange-200",
    refunded: "bg-purple-50 text-purple-800 border-purple-200",
  };

  const currentStatus = booking?.status ?? "draft";

  return (
    <div className="flex flex-col rounded-2xl border border-[#E5DFC6] bg-white">
      <div className="flex items-center justify-between border-b border-[#E5DFC6] px-3 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7A7151]">
          Booking & Payment
        </p>
        <Badge
          className={`border px-2 py-0.5 text-[11px] ${statusColor[currentStatus]}`}
        >
          {statusLabel[currentStatus]}
        </Badge>
      </div>

      <div className="space-y-3 px-3 py-3">
        {acceptedAt ? (
          <p className="text-[11px] text-[#4a4a4a]">
            Proposal accepted on{" "}
            {new Date(acceptedAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        ) : (
          <p className="text-[11px] text-[#8C8470]">
            Once a traveler accepts a proposal, you can prepare a quote and send
            a payment link here.
          </p>
        )}

        {booking && booking.total_price > 0 && (
          <div className="space-y-1 rounded-lg bg-[#F7F3EA] px-2 py-2 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-[#7A7151]">Total trip value:</span>
              <span className="font-semibold text-[#0a2225]">
                {formatCurrency(booking.total_price, booking.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#7A7151]">Platform fee (3.5%):</span>
              <span className="text-[#7A7151]">
                {formatCurrency(booking.platform_commission || 0, booking.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-[#E5DFC6] pt-1">
              <span className="font-semibold text-[#7A7151]">Your payout:</span>
              <span className="font-semibold text-[#0a2225]">
                {formatCurrency(booking.partner_payout || 0, booking.currency)}
              </span>
            </div>
          </div>
        )}

        <div className="grid gap-2 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wide text-[#7A7151]">
              Total trip amount
            </label>
            <Input
              className="h-8 text-xs"
              placeholder="e.g. 12000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wide text-[#7A7151]">
              Currency
            </label>
            <Input
              className="h-8 text-xs uppercase"
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toLowerCase())}
              maxLength={3}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          {booking?.payment_url ? (
            <a
              href={booking.payment_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-[11px] text-[#7A7151] underline-offset-4 hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              View payment link
            </a>
          ) : (
            <span className="text-[11px] text-[#8C8470]">
              No payment link yet.
            </span>
          )}

          <Button
            size="sm"
            className="h-7 text-[11px] bg-[#0a2225] text-[#E5DFC6] hover:bg-[#0a2225]/90"
            disabled={creating || !amount.trim()}
            onClick={handleCreateLink}
          >
            {creating ? "Creating…" : "Create payment link"}
          </Button>
        </div>
      </div>
    </div>
  );
}
