// src/pages/PartnerBookingsPage.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { ContractStatusCard } from "@/components/contracts/ContractStatusCard";
import { MapPin, HandCoins, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { confirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

type BookingRow = {
  id: string;
  status: string;
  partner_role: string;
  traveler_id: string;
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
  const [hireProposalIds, setHireProposalIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setLoadError(null);
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
          traveler_id,
          total_price,
          proposal_id,
          deposit_amount,
          partner_payout,
          currency,
          created_at,
          metadata,
          trip_requests:trip_request_id (
            id,
            title,
            destination,
            start_date,
            end_date,
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
        setLoadError(error.message || "Unable to load bookings.");
        setBookings([]);
      try {
        const ids = (([]) as any[] | null | undefined)?.map((b: any) => b.proposal_id).filter(Boolean) ?? [];
        if (ids.length) {
          const { data: props } = await (supabase
            .from("trip_proposals")
            .select("id, price_breakdown" as any)
            .in("id", ids) as any);
          setHireProposalIds(new Set(((props as any[]) || []).filter((pr) => (pr.price_breakdown as any)?.hire).map((pr) => pr.id)));
        }
      } catch { /* hire detection is cosmetic here */ }
      } else {
        const rows = (data ?? []) as BookingRow[];
        setBookings(rows.map((r) => ({ ...r, traveler: null })) as BookingRow[]);

        // Traveler names + trip cover images load separately — if either
        // fails, the page still works.
        const ids = Array.from(
          new Set(rows.map((r: any) => r.traveler_id).filter(Boolean))
        );
        const tripIds = Array.from(
          new Set(
            rows
              .map((r: any) => (r.metadata as any)?.trip_id)
              .filter(Boolean)
          )
        );
        const [profsRes, coversRes] = await Promise.all([
          ids.length > 0
            ? supabase.from("profiles").select("id, display_name, full_name").in("id", ids)
            : Promise.resolve({ data: null }),
          tripIds.length > 0
            ? supabase.from("packaged_trips").select("id, cover_image_url").in("id", tripIds)
            : Promise.resolve({ data: null }),
        ]);
        if (isMounted) {
          const byId = new Map(((profsRes.data as any[]) ?? []).map((p: any) => [p.id, p]));
          const coverById = new Map(
            ((coversRes.data as any[]) ?? []).map((t: any) => [t.id, t.cover_image_url])
          );
          setBookings(
            rows.map((r: any) => ({
              ...r,
              traveler: byId.get(r.traveler_id) ?? null,
              cover: coverById.get((r.metadata as any)?.trip_id) ?? null,
            })) as BookingRow[]
          );
        }
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
              escrow and released on milestones: your deposit as working
              capital once reservations are confirmed, the balance when your
              traveler confirms the trip. Goldsainte's flat 3.5% on each side.
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
            ) : loadError ? (
              <div className="rounded-3xl border border-[#C7A962]/50 bg-[#C7A962]/10 px-6 py-8 text-center">
                <h3 className="font-secondary text-xl text-[#8D6B2F] mb-1">Couldn't load your bookings</h3>
                <p className="text-sm text-[#8D6B2F]/80 break-words">{loadError}</p>
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
              <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {bookings.map((b) => (
                  <PartnerBookingRowCard isHireBooking={hireProposalIds.has((b as any).proposal_id)}
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

function PartnerBookingRowCard({ isHireBooking, booking,
  onStatusChange, }: {
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
      title: "Request payment release?",
      description:
        "Goldsainte holds trip funds in escrow. This notifies your traveler and Goldsainte that you're ready — share your confirmed reservations with them in Messages and they release your deposit as working capital; when the trip is complete they confirm it to release the final payment.",
      confirmText: "Send request",
    });
    if (!ok) return;
    setReleasing(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "release-trip-deposit",
        { body: { tripBookingId: booking.id, action: "request_release" } }
      );
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success("Request sent — your traveler and Goldsainte have been notified.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to send the release request");
    } finally {
      setReleasing(false);
    }
  };

  const total =
    booking.total_price != null
      ? `$${(Number(booking.total_price) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : "—";
  // Until release, show the expected 96.5% payout (Goldsainte keeps 3.5%);
  // after release, show the recorded figure.
  const payoutValue =
    booking.partner_payout && booking.partner_payout > 0
      ? Number(booking.partner_payout) / 100
      : Math.round((Number(booking.total_price || 0) / 100) * 96.5) / 100;
  const payoutLabel =
    booking.partner_payout && booking.partner_payout > 0
      ? "Your payout"
      : "Est. payout";
  const payout = `$${payoutValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const title =
    trip?.title ||
    (booking.metadata as any)?.trip_title ||
    trip?.destination ||
    "Goldsainte Trip";
  const travelerName =
    booking.traveler?.display_name || booking.traveler?.full_name || null;
  const initial = (travelerName || "T").trim().charAt(0).toUpperCase();

  const fmt = (d?: string | null) =>
    d
      ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : null;
  const dates =
    trip?.start_date && trip?.end_date
      ? `${fmt(trip.start_date)} – ${fmt(trip.end_date)}`
      : fmt(trip?.start_date) || null;

  return (
    <Link
      to={`/booking/${booking.id}`}
      className="block overflow-hidden rounded-2xl bg-white shadow-[0_2px_16px_rgba(0,0,0,0.07)] ring-1 ring-transparent transition hover:ring-[#C7A962]/60"
    >
      {/* Cover */}
      <div className="relative h-44 w-full">
        {(booking as any).cover ? (
          <img
            src={(booking as any).cover}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#0c4d47] to-[#0a2225]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a2225]/85 via-[#0a2225]/20 to-transparent" />
        <span className="absolute right-3 top-3 rounded-full bg-[#0a2225]/55 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-[#E5DFC6] backdrop-blur-sm">
          {booking.status.replace(/_/g, " ")}
        </span>
        <div className="absolute inset-x-4 bottom-3">
          <p className="text-[9.5px] uppercase tracking-[0.22em] text-[#E5DFC6]/75">
            GS-{booking.id.slice(0, 8).toUpperCase()} · Booked{" "}
            {new Date(booking.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </p>
          <h2 className="mt-1 truncate font-secondary text-[21px] leading-tight text-[#fdfaf2]">
            {title}
          </h2>
        </div>
      </div>

      <div className="p-4 md:p-5">
      {/* Traveler + meta */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0c4d47] text-[11px] font-medium text-[#E5DFC6]">
            {initial}
          </span>
          <span className="text-[13.5px] text-[#0a2225]/75">
            {travelerName || "Traveler"}
          </span>
        </span>
        {dates && (
          <span className="text-[13px] text-[#0a2225]/50">· {dates}</span>
        )}
        {travelers > 0 && (
          <span className="text-[13px] text-[#0a2225]/50">
            · {travelers} traveler{travelers === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {/* Money */}
      <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl bg-[#fdfaf2] px-4 py-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#0a2225]/45">
            Trip total
          </p>
          <p className="mt-0.5 font-secondary text-[17px] text-[#0a2225]">{total}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#0a2225]/45">
            {payoutLabel}
          </p>
          <p className="mt-0.5 font-secondary text-[17px] text-[#0c4d47]">{payout}</p>
          <p className="text-[10.5px] text-[#0a2225]/40">
            96.5% after Goldsainte's 3.5%
          </p>
        </div>
      </div>

      {!isHireBooking && (
      <ContractStatusCard
        variant="agent"
        bookingId={booking.id}
        travelerId={(booking as any).traveler_id ?? null}
        partnerRole={booking.partner_role ?? null}
        tripTitle={(booking as any).trip_requests?.title || (booking.metadata as any)?.trip_title || null}
        destination={(booking as any).trip_requests?.destination ?? null}
        startDate={(booking as any).trip_requests?.start_date ?? null}
        endDate={(booking as any).trip_requests?.end_date ?? null}
      />
      )}

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center justify-end gap-2.5">
        <span className="rounded-full border border-[#0a2225]/15 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[#0a2225]/60 transition-colors group-hover:border-[#C7A962]">
          View details
        </span>
        {["confirmed", "paid_in_full"].includes(booking.status) && (
          <button
            type="button"
            onClick={handleRelease}
            disabled={releasing}
            className="rounded-full bg-[#0c4d47] px-6 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em] text-[#E5DFC6] transition-colors hover:bg-[#0a2225] disabled:opacity-50"
          >
            {releasing ? "Sending…" : "Request release"}
          </button>
        )}
      </div>
      </div>
    </Link>
  );
}
