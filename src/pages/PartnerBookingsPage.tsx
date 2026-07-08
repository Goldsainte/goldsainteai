// src/pages/PartnerBookingsPage.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, HandCoins, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { confirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

type BookingRow = {
  id: string;
  status: string;
  partner_role: string;
  total_price: number;
  deposit_amount: number | null;
  partner_payout: number;
  currency: string;
  created_at: string;
  metadata: Record<string, any> | null;
  traveler: { display_name: string | null; full_name: string | null } | null;
  trip_requests: {
    id: string;
    title: string | null;
    destination: string | null;
    travelers_adults: number | null;
    travelers_children: number | null;
  } | null;
};

export default function PartnerBookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        navigate("/auth?returnTo=/partner-bookings", { replace: true });
        return;
      }

      const { data, error } = await supabase
        .from("trip_bookings")
        .select(
          `
          id,
          status,
          partner_role,
          total_price,
          deposit_amount,
          partner_payout,
          currency,
          created_at,
          metadata,
          traveler:traveler_id (
            display_name,
            full_name
          ),
          trip_requests:trip_request_id (
            id,
            title,
            destination,
            travelers_adults,
            travelers_children
          )
        `
        )
        .eq("partner_id", user.id)
        .order("created_at", { ascending: false });

      if (!isMounted) return;

      if (error) {
        console.error("Error loading partner bookings:", error);
        setBookings([]);
      } else {
        setBookings((data ?? []) as BookingRow[]);
      }

      setLoading(false);
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  return (
    <>
      <Helmet>
        <title>My Bookings · Goldsainte</title>
      </Helmet>

      <div className="flex-1 bg-[#f7f3ea] text-[#0a2225]">
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-10 md:py-12">
          <header className="max-w-2xl">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#8D6B2F]">
              Partner studio
            </p>
            <h1 className="mt-3 font-secondary text-4xl leading-[1.02] text-[#0a2225] md:text-5xl">
              Bookings with you
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-[#0a2225]/60">
              Every trip a traveler has confirmed with you — payments held in
              escrow until you release them, with Goldsainte's flat 3.5% on
              each side.
            </p>
          </header>

          <section className="mt-12">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-24 rounded-3xl bg-[#0a2225]/60 animate-pulse"
                  />
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#E5DFC6] bg-white/70 px-6 py-12 text-center">
                <MapPin className="h-8 w-8 text-[#C7A962] mx-auto mb-3" />
                <h3 className="font-secondary text-xl text-[#0a2225] mb-1">No bookings yet</h3>
                <p className="text-sm text-[#6B7280]">
                  When travelers book your trips, they'll appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((b) => (
                  <PartnerBookingRowCard
                    key={b.id}
                    booking={b}
                    onStatusChange={(id, status) => {
                      setBookings((prev) =>
                        prev.map((row) =>
                          row.id === id ? { ...row, status } : row
                        )
                      );
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

function PartnerBookingRowCard({
  booking,
  onStatusChange,
}: {
  booking: BookingRow;
  onStatusChange?: (id: string, status: string) => void;
}) {
  const trip = booking.trip_requests;
  const travelers =
    (trip?.travelers_adults || 0) + (trip?.travelers_children || 0);
  const [releasing, setReleasing] = useState(false);

  const handleRelease = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = await confirmDialog({
      title: "Release the deposit?",
      description: "This will mark the trip as completed and transfer the deposit. This action cannot be undone.",
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
      onStatusChange?.(booking.id, "completed");
      toast.success("Deposit released. Booking completed.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to release deposit");
    } finally {
      setReleasing(false);
    }
  };

  const total =
    booking.total_price != null
      ? `$${Number(booking.total_price).toFixed(2)}`
      : "—";
  // Until release, show the expected 96.5% payout (Goldsainte keeps 3.5%);
  // after release, show the recorded figure.
  const payoutValue =
    booking.partner_payout && booking.partner_payout > 0
      ? Number(booking.partner_payout)
      : Math.round(Number(booking.total_price || 0) * 96.5) / 100;
  const payoutLabel =
    booking.partner_payout && booking.partner_payout > 0
      ? "Your payout"
      : "Est. payout (96.5%)";
  const payout = `$${payoutValue.toFixed(2)}`;

  return (
    <Link
      to={`/booking/${booking.id}`}
      className="flex flex-col gap-2 rounded-3xl bg-[#f6f3ea]/95 p-4 text-xs text-[#0a2225] shadow-sm ring-1 ring-[#E5DFC6] hover:ring-[#BFAD72]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[#8D6B2F]">
            GS-{booking.id.slice(0, 8).toUpperCase()} · Booked{" "}
            {new Date(booking.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </p>
          <h2 className="mt-1.5 font-secondary text-xl leading-tight text-[#0a2225]">
            {trip?.title ||
              (booking.metadata as any)?.trip_title ||
              trip?.destination ||
              "Goldsainte Trip"}
          </h2>
          {(booking.traveler?.display_name || booking.traveler?.full_name) && (
            <p className="mt-1 text-[13px] text-[#0a2225]/55">
              Traveler:{" "}
              {booking.traveler?.display_name || booking.traveler?.full_name}
            </p>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-[#0c4d47] px-3 py-1 text-[9px] font-medium uppercase tracking-[0.16em] text-[#E5DFC6]">
          {booking.status.replace(/_/g, " ")}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#4a4a4a]">
        <div className="flex items-center gap-3">
          {trip?.destination && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3 text-[#8D8D8D]" />
              {trip.destination}
            </span>
          )}
          {travelers > 0 && (
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3 text-[#8D8D8D]" />
              {travelers} travelers
            </span>
          )}
        </div>
        <div className="flex flex-col items-end gap-0.5 text-right">
          <span className="text-[13px] text-[#0a2225]/60">
            Total{" "}
            <span className="ml-1 font-secondary text-[16px] text-[#0a2225]">
              {total}
            </span>
          </span>
          <span className="text-[12px] text-[#0a2225]/55">
            {payoutLabel}{" "}
            <span className="ml-1 font-secondary text-[15px] text-[#0c4d47]">
              {payout}
            </span>
          </span>
        </div>
      </div>

      {booking.status === "confirmed" && (
        <div className="mt-1 flex justify-end">
          <Button
            size="sm"
            onClick={handleRelease}
            disabled={releasing}
            className="rounded-full bg-[#0c4d47] px-6 py-2.5 text-[13px] font-medium uppercase tracking-[0.12em] text-[#E5DFC6] hover:bg-[#0a2225]"
          >
            {releasing ? "Releasing…" : "Release deposit"}
          </Button>
        </div>
      )}
    </Link>
  );
}
