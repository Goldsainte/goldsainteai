import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Calendar, MapPin, ArrowRight, Users, HandCoins, Sparkles, Trash2, Plane, Globe } from "lucide-react";
import { getTripRequestImageUrl } from "@/utils/tripImages";
import { supabase } from "@/integrations/supabase/client";
import { getMyTrips, type TravelerTrip } from "@/services/tripsService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/button";

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

type TripRequestWithProposals = {
  id: string;
  title: string | null;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  budget_min: number | null;
  budget_max: number | null;
  travelers_adults: number | null;
  travelers_children: number | null;
  created_at: string;
  trip_proposals?: { status: string }[];
};

export default function MyTripsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "requests";

  const [trips, setTrips] = useState<TravelerTrip[]>([]);
  const [requests, setRequests] = useState<TripRequestWithProposals[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Check auth
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
      if (userError || !authUser) {
        navigate("/auth?returnTo=/my-trips", { replace: true });
        return;
      }
      if (!cancelled) setUser(authUser);

      try {
        // Load bookings
        const bookingsData = await getMyTrips();
        if (!cancelled) setTrips(bookingsData);

        // MY TRIPS → REQUESTS VIEW: Query the same trip_requests table as Marketplace
        // This is the traveler's personal dashboard view filtered to their own traveler_id
        // The same records appear in the Marketplace when status='open' for creators/agents to bid on
        // The same records appear in the Marketplace when status='open' for creators/agents to bid on
        
        // FIXED: Removed broken nested select `trip_proposals ( status )` that was causing query to fail
        // TODO: Add proper foreign key constraint between trip_proposals and trip_requests
        // or implement separate query for proposal counts
        const result = await supabase
          .from("trip_requests")
          .select(
            `
            id,
            title,
            destination,
            start_date,
            end_date,
            status,
            budget_min,
            budget_max,
            travelers_adults,
            travelers_children,
            created_at
          `
          )
          .eq("user_id", authUser.id)
          .order("created_at", { ascending: false });
        
        const requestsData = result.data;
        const requestsError = result.error;

        if (!cancelled) {
          if (requestsError) {
            console.error("❌ [MyTripsPage] Error loading trip_requests:", requestsError);
            setRequests([]);
          } else {
            const baseRequests = (requestsData ?? []) as any[];

            // Enrich each trip request with its proposals via a separate query
            // (the nested select was removed because no FK exists between
            // trip_proposals and trip_requests).
            const requestIds = baseRequests.map((r) => r.id);
            let enriched = baseRequests;
            if (requestIds.length > 0) {
              const { data: proposalsData, error: proposalsError } =
                await supabase
                  .from("trip_proposals")
                  .select("id, trip_request_id, status, created_at")
                  .in("trip_request_id", requestIds)
                  .order("created_at", { ascending: false });

              if (proposalsError) {
                console.error(
                  "❌ [MyTripsPage] Error loading trip_proposals:",
                  proposalsError,
                );
              } else {
                const grouped = (proposalsData ?? []).reduce<
                  Record<string, { status: string }[]>
                >((acc, p) => {
                  if (!p.trip_request_id) return acc;
                  (acc[p.trip_request_id] ||= []).push({ status: p.status });
                  return acc;
                }, {});
                enriched = baseRequests.map((r) => ({
                  ...r,
                  trip_proposals: grouped[r.id] ?? [],
                }));
              }
            }

            setRequests(enriched as any);
          }
        }
      } catch (err: any) {
        // Only show error for actual failures, not empty results
        console.error("[MyTripsPage] Error loading data:", err);
        if (!cancelled) setError(null); // Don't show errors for expected empty states
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const upcoming = trips.filter(isUpcoming);
  const inProgress = trips.filter(isInProgress);
  const past = trips.filter(isPast);
  const cancelled = trips.filter(isCancelled);

  return (
    <>
      <Helmet>
        <title>My Trips · Goldsainte</title>
      </Helmet>

      <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225] pb-20 lg:pb-0">
        <section className="mx-auto max-w-5xl px-4 pt-14 pb-6 md:pt-16 md:pb-8">
          <div className="flex items-center justify-between mb-6">
            <BackButton label="Back" />
          </div>

          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#A4987C] font-medium">
              My trips
            </p>
            <h1 className="font-secondary text-2xl md:text-3xl leading-tight text-[#0a2225]">
              Your Goldsainte Journey
            </h1>
            <p className="text-sm text-[#6E6650] leading-relaxed">
              Track your trip requests, upcoming adventures, and past escapes — all in one beautifully curated space.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-16 md:pb-20">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-pulse mx-auto w-12 h-12 rounded-full bg-[#BFAD72]/20 flex items-center justify-center mb-4">
                  <Plane className="h-6 w-6 text-[#BFAD72]" />
                </div>
                <p className="text-sm text-[#6E6650]">Loading your trips…</p>
              </div>
            </div>
          )}

          {!loading && !error && (
            <Tabs defaultValue={defaultTab} className="w-full">
              {/* Custom pill-style tabs matching MarketplaceTabs */}
              <div className="inline-flex items-center gap-1 rounded-full border border-[#E5DFC6] bg-white p-1 mb-6">
                <TabsList className="bg-transparent p-0 h-auto gap-1">
                  <TabsTrigger 
                    value="requests"
                    className="rounded-full px-4 py-2.5 text-sm font-semibold transition-all data-[state=active]:bg-[#BFAD72] data-[state=active]:text-white data-[state=inactive]:text-[#4a4a4a] data-[state=inactive]:hover:text-[#0a2225] data-[state=inactive]:bg-transparent"
                  >
                    Requests
                  </TabsTrigger>
                  <TabsTrigger 
                    value="in-progress"
                    className="rounded-full px-4 py-2.5 text-sm font-semibold transition-all data-[state=active]:bg-[#BFAD72] data-[state=active]:text-white data-[state=inactive]:text-[#4a4a4a] data-[state=inactive]:hover:text-[#0a2225] data-[state=inactive]:bg-transparent"
                  >
                    In Progress
                  </TabsTrigger>
                  <TabsTrigger 
                    value="booked"
                    className="rounded-full px-4 py-2.5 text-sm font-semibold transition-all data-[state=active]:bg-[#BFAD72] data-[state=active]:text-white data-[state=inactive]:text-[#4a4a4a] data-[state=inactive]:hover:text-[#0a2225] data-[state=inactive]:bg-transparent"
                  >
                    Booked &amp; Past
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="requests" className="space-y-5">
                {requests.length === 0 ? (
                  <div className="rounded-3xl bg-white/95 border border-[#E5DFC6] p-8 md:p-12 text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-[#BFAD72]/15 flex items-center justify-center mb-6">
                      <Globe className="h-8 w-8 text-[#BFAD72]" />
                    </div>
                    <h3 className="font-secondary text-xl md:text-2xl mb-3 text-[#0a2225]">
                      Where will your next adventure take you?
                    </h3>
                    <p className="text-sm text-[#6E6650] mb-6 max-w-md mx-auto leading-relaxed">
                      Share your dream destination with the Goldsainte marketplace. Our curated network of creators and agents will craft personalized proposals just for you.
                    </p>
                    <Button asChild className="rounded-full bg-[#0c4d47] hover:bg-[#0a3d3a] text-white px-5 py-2.5 h-auto">
                      <Link to="/post-trip" className="inline-flex items-center gap-2 whitespace-nowrap">
                        <Sparkles className="h-4 w-4" />
                        Post Your Dream Trip
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {requests.map((req) => (
                      <TripRequestRow 
                        key={req.id} 
                        req={req}
                        onDelete={(id) => {
                          setRequests(prev => prev.filter(r => r.id !== id));
                        }}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="in-progress" className="space-y-5">
                {inProgress.length === 0 ? (
                  <div className="rounded-3xl bg-white/95 border border-[#E5DFC6] p-8 md:p-12 text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-[#BFAD72]/15 flex items-center justify-center mb-6">
                      <Plane className="h-8 w-8 text-[#BFAD72]" />
                    </div>
                    <h3 className="font-secondary text-xl md:text-2xl mb-3 text-[#0a2225]">
                      No trips in progress
                    </h3>
                    <p className="text-sm text-[#6E6650] max-w-md mx-auto leading-relaxed">
                      When you're on an adventure, your active trips will appear here with all the details you need.
                    </p>
                  </div>
                ) : (
                  <TripsSection title="In progress" trips={inProgress} />
                )}
              </TabsContent>

              <TabsContent value="booked" className="space-y-5">
                {trips.length === 0 ? (
                  <div className="rounded-3xl bg-white/95 border border-[#E5DFC6] p-8 md:p-12 text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-[#BFAD72]/15 flex items-center justify-center mb-6">
                      <Calendar className="h-8 w-8 text-[#BFAD72]" />
                    </div>
                    <h3 className="font-secondary text-xl md:text-2xl mb-3 text-[#0a2225]">
                      Your travel story starts here
                    </h3>
                    <p className="text-sm text-[#6E6650] mb-6 max-w-md mx-auto leading-relaxed">
                      Book through Goldsainte or accept a curated proposal from our creators and agents. Every journey becomes part of your story.
                    </p>
                    <Button asChild className="rounded-full bg-[#0c4d47] hover:bg-[#0a3d3a] text-white px-5 py-2.5 h-auto">
                      <Link to="/marketplace" className="inline-flex items-center gap-2 whitespace-nowrap">
                        Explore the Marketplace
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <>
                    <TripsSection title="Upcoming trips" trips={upcoming} />
                    <TripsSection title="Past trips" trips={past} />
                    <TripsSection title="Cancelled & resolved" trips={cancelled} muted />
                  </>
                )}
              </TabsContent>
            </Tabs>
          )}
        </section>
      </main>
    </>
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

function TripRequestRow({ req, onDelete }: { req: TripRequestWithProposals; onDelete: (id: string) => void }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const proposals = req.trip_proposals ?? [];
  const proposalCount = proposals.length;
  const acceptedCount = proposals.filter(
    (p) => p.status === "accepted"
  ).length;

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm("Are you sure you want to delete this trip request? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("trip_requests")
        .delete()
        .eq("id", req.id);

      if (error) throw error;

      toast.success("Trip request deleted");
      onDelete(req.id);
    } catch (error: any) {
      console.error("Error deleting trip request:", error);
      toast.error("Failed to delete trip request");
    } finally {
      setIsDeleting(false);
    }
  };

  const travelers =
    (req.travelers_adults || 0) + (req.travelers_children || 0);

  const dates =
    req.start_date && req.end_date
      ? `${req.start_date} → ${req.end_date}`
      : "Dates flexible / not set";

  const budget =
    req.budget_max || req.budget_min
      ? `$${req.budget_min || ""}–$${req.budget_max || ""} pp`
      : "Budget not specified";

  const statusLabel =
    req.status === "open"
      ? "Open"
      : req.status === "matched"
      ? "Matched"
      : req.status === "completed"
      ? "Completed"
      : "Archived";

  const statusColor =
    req.status === "open"
      ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
      : req.status === "matched"
      ? "bg-[#BFAD72]/15 text-[#BFAD72] ring-[#BFAD72]/30"
      : req.status === "completed"
      ? "bg-[#0c4d47]/10 text-[#0c4d47] ring-[#0c4d47]/30"
      : "bg-[#8D8D8D]/10 text-[#8D8D8D] ring-[#8D8D8D]/30";

  return (
    <div className="group relative cursor-pointer space-y-2.5">
      <Link to={`/trip-request/${req.id}`} className="block">
        {/* Destination image */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl md:rounded-2xl">
          <img
            src={getTripRequestImageUrl(req.destination)}
            alt={req.destination || "Trip destination"}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {/* Status badge */}
          <span
            className={`absolute top-2.5 left-2.5 inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium ring-1 ${statusColor}`}
          >
            {statusLabel}
          </span>
        </div>

        {/* Content below image */}
        <div className="space-y-1 px-0.5 pt-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-secondary text-sm md:text-[15px] text-[#0a2225] font-medium leading-snug line-clamp-1">
              {req.title || `Trip to ${req.destination || "somewhere special"}`}
            </h3>
          </div>

          <p className="flex items-center gap-1 text-[13px] text-[#6B7280]">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{req.destination || "Destination TBD"}</span>
          </p>

          <p className="flex items-center gap-1 text-[13px] text-[#6B7280]">
            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="line-clamp-1">{dates}</span>
          </p>

          <div className="flex items-center gap-3 text-[13px] text-[#6B7280]">
            {travelers > 0 && (
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {travelers}
              </span>
            )}
            <span className="flex items-center gap-1">
              <HandCoins className="h-3.5 w-3.5" />
              {budget}
            </span>
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <span className="text-[12px] text-[#8D8D8D]">
              {proposalCount} proposal{proposalCount === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </Link>

      {/* Delete button */}
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="absolute top-2.5 right-2.5 rounded-full bg-white/90 p-1.5 text-[#8D8D8D] opacity-0 shadow-sm transition-opacity hover:text-red-600 group-hover:opacity-100"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
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
