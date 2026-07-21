// src/pages/PartnerBookingsPage.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { ContractStatusCard } from "@/components/contracts/ContractStatusCard";
import { MapPin, HandCoins, Users, ArrowRight } from "lucide-react";
import { getTripRequestImageUrl } from "@/utils/tripImages";
import { Button } from "@/components/ui/button";

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
      } else {
        const rows = (data ?? []) as BookingRow[];
        try {
          const pids = Array.from(new Set(rows.map((r: any) => r.proposal_id).filter(Boolean)));
          if (pids.length) {
            const { data: props } = await (supabase
              .from("trip_proposals")
              .select("id, price_breakdown" as any)
              .in("id", pids) as any);
            if (isMounted) {
              setHireProposalIds(new Set(((props as any[]) || []).filter((pr) => (pr.price_breakdown as any)?.hire).map((pr) => pr.id)));
            }
          }
        } catch { /* hire badge is cosmetic */ }
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
              Every trip a traveler has confirmed with you — payments charged
              directly on your own Stripe account the moment they pay, deposit
              and balance alike. Goldsainte's flat 3.5% on each side, collected
              automatically.
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

  const total =
    booking.total_price != null
      ? `$${(Number(booking.total_price) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : "—";
  // Show the expected 96.5% payout (Goldsainte keeps 3.5%) until the recorded
  // payout figure is available, then show that.
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

  const reference = `GS-${booking.id.slice(0, 8).toUpperCase()}`;
  const booked = new Date(booking.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const imgUrl = trip?.destination ? getTripRequestImageUrl(trip.destination) : null;
  void onStatusChange; void initial; void total;
  return (
    <Link
      to={`/booking/${booking.id}`}
      className="group block overflow-hidden rounded-2xl bg-white ring-1 ring-[#E5DFC6] transition-all duration-300 hover:ring-[#C7A962]/70 hover:shadow-[0_10px_36px_-14px_rgba(10,34,37,0.25)]"
    >
      {/* Photo IS the card */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#0c4d47] to-[#0a2225]">
          <span className="font-secondary text-xl italic text-[#C7A962]/80">Goldsainte</span>
        </div>
        {imgUrl && (
          <img src={imgUrl} alt={title} loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" onError={(e) => { e.currentTarget.style.display = "none"; }} />
        )}
        <span className="absolute right-3.5 top-3.5 rounded-full bg-[#0c4d47]/95 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-[#E5DFC6]">
          {booking.status.replace(/_/g, " ")}
        </span>
        {isHireBooking && (
          <span className="absolute left-3.5 top-3.5 rounded bg-[#C7A962] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0a2225]">
            On-trip hire
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#061418]/85 to-transparent px-5 pb-4 pt-12">
          {trip?.destination && (
            <p className="text-[10px] uppercase tracking-[0.24em] text-[#C7A962]/95">{trip.destination}</p>
          )}
          <p className="mt-1.5 font-secondary text-[22px] leading-[1.1] text-[#fdfaf2] line-clamp-2">{title}</p>
          <p className="mt-1.5 text-[12.5px] text-[#fdfaf2]/80">
            Booked {booked}
            {travelerName ? ` \u00b7 ${travelerName}` : ""}
            {travelers ? ` \u00b7 ${travelers} traveler${travelers === 1 ? "" : "s"}` : ""}
          </p>
        </div>
      </div>
      {/* Slim footer strip */}
      <div className="flex items-center justify-between px-5 py-3.5">
        <span className="text-[12.5px] text-[#0a2225]/55">
          <span className="font-mono text-[11.5px] tracking-wide">{reference}</span>
          {" \u00b7 "}
          {payoutLabel.toLowerCase()} {payout}
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.18em] text-[#0c4d47]">
          View details
          <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
