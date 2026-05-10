// src/pages/PartnerBookingsPage.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, HandCoins, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type BookingRow = {
  id: string;
  status: string;
  partner_role: string;
  total_price: number;
  partner_payout: number;
  currency: string;
  created_at: string;
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
          partner_payout,
          currency,
          created_at,
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
          <header className="space-y-2">
            <p className="text-xs uppercase tracking-[0.18em] text-[#C7A962]">
              Partner dashboard
            </p>
            <h1 className="font-secondary text-2xl md:text-3xl text-[#0a2225]">
              My Goldsainte Bookings
            </h1>
            <p className="text-sm text-[#6B7280]">
              These are trips travelers have booked with you as a TikTok creator or travel agent.
            </p>
          </header>

          <section className="mt-6">
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
    if (!confirm("Release the deposit and mark this trip as completed?")) return;
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
      ? `$${(booking.total_price / 100).toFixed(2)} ${booking.currency}`
      : "—";

  const payout =
    booking.partner_payout != null
      ? `$${(booking.partner_payout / 100).toFixed(2)} ${booking.currency}`
      : "—";

  return (
    <Link
      to={`/booking/${booking.id}`}
      className="flex flex-col gap-2 rounded-3xl bg-[#f6f3ea]/95 p-4 text-xs text-[#0a2225] shadow-sm ring-1 ring-[#E5DFC6] hover:ring-[#BFAD72]"
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs text-[#6B7280]">
            Booked {new Date(booking.created_at).toLocaleDateString()}
          </p>
          <h2 className="mt-1 text-sm font-semibold">
            {trip?.title || trip?.destination || "Goldsainte trip"}
          </h2>
        </div>
        <span className="rounded-full bg-[#0c4d47]/8 px-3 py-1 text-[10px] font-medium text-[#0c4d47]">
          {booking.status}
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
        <div className="flex flex-col items-end gap-1 text-right">
          <span className="inline-flex items-center gap-1">
            <HandCoins className="h-3 w-3 text-[#8D8D8D]" />
            Total: {total}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px]">
            <HandCoins className="h-3 w-3 text-[#8D8D8D]" />
            Your payout: {payout}
          </span>
        </div>
      </div>

      {booking.status === "confirmed" && (
        <div className="mt-1 flex justify-end">
          <Button
            size="sm"
            onClick={handleRelease}
            disabled={releasing}
            className="bg-[#0c4d47] hover:bg-[#0c4d47]/90 text-white text-xs"
          >
            {releasing ? "Releasing…" : "Release Deposit"}
          </Button>
        </div>
      )}
    </Link>
  );
}
