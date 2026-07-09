import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ContractStatusCard } from "@/components/contracts/ContractStatusCard";
import { confirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { ChevronLeft, MessageCircle, Loader2 } from "lucide-react";

type BookingRow = {
  id: string;
  status: string;
  partner_role: string | null;
  traveler_id: string;
  partner_id: string;
  total_price: number | null;
  deposit_amount: number | null;
  partner_payout: number | null;
  currency: string | null;
  created_at: string;
  metadata: Record<string, any> | null;
  trip_requests: {
    id: string;
    title: string | null;
    destination: string | null;
    start_date: string | null;
    end_date: string | null;
    travelers_adults: number | null;
    travelers_children: number | null;
  } | null;
};

export default function PartnerBookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingRow | null>(null);
  const [travelerName, setTravelerName] = useState<string | null>(null);
  const [cover, setCover] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [releasing, setReleasing] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!id) return;
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate(`/auth?returnTo=/booking/${id}`, { replace: true });
          return;
        }
        const { data, error } = await supabase
          .from("trip_bookings")
          .select(
            `
            id, status, partner_role, traveler_id, partner_id,
            total_price, deposit_amount, partner_payout, currency,
            created_at, metadata,
            trip_requests:trip_request_id (
              id, title, destination, start_date, end_date,
              travelers_adults, travelers_children
            )
          `
          )
          .eq("id", id)
          .maybeSingle();
        if (error) throw error;
        if (!data) throw new Error("Booking not found.");

        // Partners only — travelers get their own page.
        if (data.partner_id !== user.id) {
          navigate(
            data.traveler_id === user.id ? `/bookings/${id}` : "/partner-bookings",
            { replace: true }
          );
          return;
        }
        if (!alive) return;
        setBooking(data as BookingRow);

        // Non-fatal enrichments
        const [{ data: prof }, coverRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("display_name, full_name")
            .eq("id", data.traveler_id)
            .maybeSingle(),
          (data.metadata as any)?.trip_id
            ? supabase
                .from("packaged_trips")
                .select("cover_image_url")
                .eq("id", (data.metadata as any).trip_id)
                .maybeSingle()
            : Promise.resolve({ data: null } as any),
        ]);
        if (!alive) return;
        setTravelerName(prof?.display_name || prof?.full_name || null);
        setCover((coverRes.data as any)?.cover_image_url ?? null);
      } catch (e: any) {
        console.error("Booking load failed:", e);
        toast.error(e.message || "Couldn't load this booking.");
        navigate("/partner-bookings", { replace: true });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, navigate]);

  async function handleRelease() {
    if (!booking) return;
    const ok = await confirmDialog({
      title: "Release the deposit?",
      description:
        "This will mark the trip as completed and transfer the deposit. This action cannot be undone.",
      confirmText: "Release deposit",
    });
    if (!ok) return;
    setReleasing(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "release-trip-deposit",
        { body: { tripBookingId: booking.id } }
      );
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setBooking({ ...booking, status: "completed" });
      toast.success("Deposit released. Booking completed.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to release deposit");
    } finally {
      setReleasing(false);
    }
  }

  if (loading || !booking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f3ea]">
        <Loader2 className="h-8 w-8 animate-spin text-[#C7A962]" />
      </div>
    );
  }

  const trip = booking.trip_requests;
  const title =
    trip?.title ||
    (booking.metadata as any)?.trip_title ||
    trip?.destination ||
    "Goldsainte Trip";
  const initial = (travelerName || "T").trim().charAt(0).toUpperCase();
  const money = (v: number | null | undefined) =>
    v != null ? `$${Number(v).toFixed(2)}` : "—";
  const payoutValue =
    booking.partner_payout && booking.partner_payout > 0
      ? Number(booking.partner_payout)
      : Math.round(Number(booking.total_price || 0) * 96.5) / 100;
  const payoutLabel =
    booking.partner_payout && booking.partner_payout > 0
      ? "Your payout"
      : "Est. payout (96.5%)";
  const balance = Math.max(
    0,
    Number(booking.total_price || 0) - Number(booking.deposit_amount || 0)
  );

  // Payment journey: deposit → balance → released
  const depositPaid = ["confirmed", "paid_in_full", "completed"].includes(booking.status);
  const balancePaid = ["paid_in_full", "completed"].includes(booking.status);
  const released = booking.status === "completed";
  const paymentDots = [
    { label: "Deposit", on: depositPaid },
    { label: "Balance", on: balancePaid },
    { label: "Released", on: released },
  ];
  const journeyLabel = released
    ? "Deposit released — booking complete"
    : balancePaid
      ? "Paid in full — funds in escrow"
      : depositPaid
        ? "Deposit in escrow — balance pending"
        : "Awaiting deposit";

  const fmt = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : null;
  const dates =
    trip?.start_date && trip?.end_date
      ? `${fmt(trip.start_date)} – ${fmt(trip.end_date)}`
      : fmt(trip?.start_date) || null;

  return (
    <div className="min-h-screen bg-[#f7f3ea]">
      {/* Command bar — two-tier */}
      <div className="sticky top-0 z-40 shadow-[0_2px_16px_rgba(10,34,37,0.28)]">
        <div className="bg-gradient-to-r from-[#0c4d47] to-[#0a2225]">
          <div className="mx-auto flex h-[72px] max-w-3xl items-center gap-4 px-4 md:px-6">
            <button
              type="button"
              onClick={() => navigate("/partner-bookings")}
              aria-label="Back"
              className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border border-[#E5DFC6]/28 text-[#E5DFC6] transition-colors hover:bg-white/10"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-[10.5px] uppercase tracking-[0.3em] text-[#C7A962]">
                Client Booking · GS-{booking.id.slice(0, 8).toUpperCase()}
              </p>
              <h1 className="truncate font-secondary text-[23px] leading-tight text-[#fdfaf2]">
                {title}
              </h1>
            </div>
            {booking.status === "confirmed" ? (
              <button
                type="button"
                onClick={handleRelease}
                disabled={releasing}
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#C7A962] px-6 py-3 text-[13px] font-medium uppercase tracking-[0.1em] text-[#0a2225] transition-colors hover:bg-[#d9bd7d] disabled:opacity-50"
              >
                {releasing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {releasing ? "Releasing…" : "Release deposit"}
              </button>
            ) : (
              <span className="shrink-0 rounded-full border border-[#E5DFC6]/35 px-4 py-2 text-[10.5px] uppercase tracking-[0.16em] text-[#E5DFC6]">
                {booking.status.replace(/_/g, " ")}
              </span>
            )}
          </div>
        </div>
        <div className="border-t border-white/10 bg-[#083530]">
          <div className="mx-auto flex h-[46px] max-w-3xl items-center gap-5 px-4 md:px-6">
            <span className="flex items-center gap-2.5 text-[13px] text-[#E5DFC6]/78">
              <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[#C7A962] text-[11px] font-semibold text-[#0a2225]">
                {initial}
              </span>
              {travelerName || "Traveler"}
            </span>
            {dates && (
              <span className="hidden text-[13px] text-[#E5DFC6]/60 sm:inline">{dates}</span>
            )}
            <div className="flex-1" />
            <div className="hidden items-center gap-3 md:flex">
              {paymentDots.map((d) => (
                <span key={d.label} className="flex items-center gap-1.5">
                  <span
                    className={`h-[10px] w-[10px] rounded-full ${
                      d.on ? "bg-[#C7A962]" : "border border-[#E5DFC6]/45 bg-transparent"
                    }`}
                  />
                  <span className={`text-[11.5px] ${d.on ? "text-[#E5DFC6]/85" : "text-[#E5DFC6]/45"}`}>
                    {d.label}
                  </span>
                </span>
              ))}
            </div>
            <span className="text-[12.5px] text-[#E5DFC6]/78">{journeyLabel}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 md:px-6">
        {/* Cover */}
        <div className="relative h-56 overflow-hidden rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
          {cover ? (
            <img src={cover} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#0c4d47] to-[#0a2225]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a2225]/70 via-transparent to-transparent" />
          <p className="absolute bottom-3 left-4 text-[12px] text-[#E5DFC6]/85">
            Booked{" "}
            {new Date(booking.created_at).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
            {trip?.destination ? ` · ${trip.destination}` : ""}
          </p>
        </div>

        {/* Money */}
        <div className="rounded-2xl bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.07)] md:p-7">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#8D6B2F]">Payment</p>
          <h2 className="mt-1.5 font-secondary text-[24px] leading-snug text-[#0a2225]">
            Escrow & payout
          </h2>
          <div className="mt-5 divide-y divide-[#0a2225]/8">
            <div className="flex items-baseline justify-between py-3">
              <span className="text-[14px] text-[#0a2225]/60">Trip total</span>
              <span className="font-secondary text-[19px] text-[#0a2225]">
                {money(booking.total_price)}
              </span>
            </div>
            <div className="flex items-baseline justify-between py-3">
              <span className="text-[14px] text-[#0a2225]/60">Deposit</span>
              <span className="font-secondary text-[17px] text-[#0a2225]">
                {money(booking.deposit_amount)}
              </span>
            </div>
            <div className="flex items-baseline justify-between py-3">
              <span className="text-[14px] text-[#0a2225]/60">Balance</span>
              <span className="font-secondary text-[17px] text-[#0a2225]">{money(balance)}</span>
            </div>
            <div className="flex items-baseline justify-between py-3">
              <span className="text-[14px] text-[#0a2225]/60">{payoutLabel}</span>
              <span className="font-secondary text-[19px] text-[#0c4d47]">
                ${payoutValue.toFixed(2)}
              </span>
            </div>
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-[#0a2225]/45">
            Traveler funds are held in escrow and released to you on completion, with
            Goldsainte's flat 3.5% on each side.
          </p>
        </div>

        {/* Contract */}
        <div className="rounded-2xl bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.07)] md:p-7">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#8D6B2F]">Agreement</p>
          <h2 className="mt-1.5 font-secondary text-[24px] leading-snug text-[#0a2225]">
            Trip contract
          </h2>
          <ContractStatusCard
            variant="agent"
            bookingId={booking.id}
            travelerId={booking.traveler_id}
            partnerRole={booking.partner_role ?? null}
            tripTitle={trip?.title || (booking.metadata as any)?.trip_title || null}
            destination={trip?.destination ?? null}
            startDate={trip?.start_date ?? null}
            endDate={trip?.end_date ?? null}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-end gap-3 pb-6">
          <button
            type="button"
            onClick={() => navigate("/messages")}
            className="inline-flex items-center gap-2 rounded-full border border-[#0a2225]/20 px-5 py-2.5 text-[12px] font-medium uppercase tracking-[0.12em] text-[#0a2225]/70 transition-colors hover:bg-white"
          >
            <MessageCircle className="h-4 w-4" />
            Message traveler
          </button>
        </div>
      </div>
    </div>
  );
}
