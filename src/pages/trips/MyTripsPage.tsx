// src/pages/trips/MyTripsPage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, ArrowRight, ArrowLeft } from "lucide-react";
import { getMyTrips, type TravelerTrip } from "@/services/tripsService";

function formatMoney(amount: number | null | undefined, currency?: string | null) {
  if (!amount) return "—";
  const cur = currency || "USD";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: cur,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${cur} ${amount.toFixed(0)}`;
  }
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString();
}

function isUpcoming(trip: TravelerTrip) {
  const status = trip.status;
  const starts = trip.trip?.starts_on ? new Date(trip.trip.starts_on) : null;
  const now = new Date();

  if (status === "cancelled_refunded" || status === "disputed") return false;
  if (!starts) return ["proposal_accepted", "pending_payment", "deposit_paid", "paid_in_full"].includes(status);
  return starts >= now && ["proposal_accepted", "pending_payment", "deposit_paid", "paid_in_full"].includes(status);
}

function isInProgress(trip: TravelerTrip) {
  const status = trip.status;
  const starts = trip.trip?.starts_on ? new Date(trip.trip.starts_on) : null;
  const ends = trip.trip?.ends_on ? new Date(trip.trip.ends_on) : null;
  const now = new Date();

  if (!starts || !ends) return false;
  return now >= starts && now <= ends && ["deposit_paid", "paid_in_full"].includes(status);
}

function isPast(trip: TravelerTrip) {
  const status = trip.status;
  if (status === "completed") return true;
  const ends = trip.trip?.ends_on ? new Date(trip.trip.ends_on) : null;
  const now = new Date();
  if (!ends) return false;
  return ends < now && ["completed", "paid_in_full", "deposit_paid"].includes(status);
}

function isCancelled(trip: TravelerTrip) {
  return ["cancelled_refunded", "disputed"].includes(trip.status);
}

export default function MyTripsPage() {
  const [trips, setTrips] = useState<TravelerTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getMyTrips();
        if (!cancelled) setTrips(data);
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Failed to load trips.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const upcoming = trips.filter(isUpcoming);
  const inProgress = trips.filter(isInProgress);
  const past = trips.filter(isPast);
  const cancelled = trips.filter(isCancelled);

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225]">
      <section className="mx-auto max-w-5xl px-4 pt-14 pb-6 md:pt-16 md:pb-8">
        <div className="flex items-center justify-between mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-[10px] text-[#8D8D8D]"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to home
          </Link>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8D8D]">
            My trips
          </p>
          <h1 className="font-display text-[22px] md:text-[24px] leading-tight">
            Every Goldsainte trip in one place
          </h1>
          <p className="text-[11px] md:text-[12px] text-[#4a4a4a] max-w-md">
            Upcoming escapes, trips in progress and past stays — all of your
            Goldsainte bookings live here with their details, payments and chat.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16 md:pb-20 space-y-5">
        {loading && (
          <p className="text-[11px] text-[#8D8D8D]">Loading your trips…</p>
        )}
        {error && (
          <p className="text-[11px] text-red-600">
            {error}
          </p>
        )}

        {!loading && !error && trips.length === 0 && (
          <div className="rounded-3xl bg-white/95 border border-[#E5DFC6] p-4 md:p-5 text-[11px]">
            <p className="text-[12px] font-semibold mb-1">
              No trips just yet
            </p>
            <p className="text-[11px] text-[#4a4a4a] mb-2">
              When you book through Goldsainte — or accept a proposal inspired
              by your favorite creators — your trips will appear here.
            </p>
            <Link
              to="/post-trip"
              className="inline-flex items-center gap-2 rounded-full bg-[#0c4d47] text-[#E5DFC6] px-4 py-2 text-[11px] font-semibold hover:bg-[#073331]"
            >
              Post a dream trip
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}

        {!loading && !error && trips.length > 0 && (
          <div className="space-y-5">
            <TripsSection title="In progress" trips={inProgress} />
            <TripsSection title="Upcoming trips" trips={upcoming} />
            <TripsSection title="Past trips" trips={past} />
            <TripsSection title="Cancelled & resolved" trips={cancelled} muted />
          </div>
        )}
      </section>
    </main>
  );
}

type TripsSectionProps = {
  title: string;
  trips: TravelerTrip[];
  muted?: boolean;
};

function TripsSection({ title, trips, muted }: TripsSectionProps) {
  if (trips.length === 0) return null;

  return (
    <section className="space-y-2">
      <h2 className="text-[11px] font-semibold text-[#4a4a4a]">{title}</h2>
      <div className="rounded-3xl bg-white/95 border border-[#E5DFC6] p-3 md:p-4">
        <div className="space-y-2">
          {trips.map((t) => (
            <TripRow key={t.booking_id} trip={t} muted={muted} />
          ))}
        </div>
      </div>
    </section>
  );
}

type TripRowProps = {
  trip: TravelerTrip;
  muted?: boolean;
};

function TripRow({ trip, muted }: TripRowProps) {
  const title =
    trip.trip?.title || trip.trip?.destination || "Goldsainte trip";

  const dates =
    trip.trip?.starts_on &&
    (trip.trip.ends_on
      ? `${formatDate(trip.trip.starts_on)} – ${formatDate(trip.trip.ends_on)}`
      : formatDate(trip.trip.starts_on));

  const currency = trip.currency || "USD";

  return (
    <Link
      to={`/bookings/${trip.booking_id}`}
      className={`flex flex-col md:flex-row md:items-center justify-between gap-2 rounded-2xl px-3 py-2 ${
        muted ? "bg-[#faf7f0]" : "bg-[#f7f3ea]"
      } border border-[#E5DFC6] hover:border-[#BFAD72]`}
    >
      <div className="space-y-0.5">
        <p className="text-[11px] font-semibold">{title}</p>
        <div className="flex flex-wrap gap-2 text-[10px] text-[#4a4a4a]">
          {trip.trip?.destination && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {trip.trip.destination}
            </span>
          )}
          {dates && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {dates}
            </span>
          )}
        </div>
        <p className="text-[10px] text-[#8D8D8D]">
          Booking status: {humanBookingStatus(trip.status)}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <p className="text-[11px] font-semibold">
          {formatMoney(trip.total_amount, currency)}
        </p>
        <span className="inline-flex items-center gap-1 text-[10px] text-[#0c4d47]">
          View booking
          <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}

function humanBookingStatus(status: string) {
  switch (status) {
    case "proposal_accepted":
      return "Proposal accepted";
    case "pending_payment":
      return "Awaiting payment";
    case "deposit_paid":
      return "Deposit paid";
    case "paid_in_full":
      return "Paid in full";
    case "completed":
      return "Trip completed";
    case "cancelled_refunded":
      return "Cancelled / refunded";
    case "disputed":
      return "In review";
    default:
      return status;
  }
}
