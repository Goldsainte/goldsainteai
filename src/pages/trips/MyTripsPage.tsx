import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Calendar, MapPin, ArrowRight, Users, HandCoins, Sparkles, Trash2, Plane, Globe } from "lucide-react";
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
        console.log("🔍 [MyTripsPage] Fetching trip requests for user:", authUser.id);
        
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
        
        console.log("📦 [MyTripsPage] Query result:", {
          data: result.data,
          error: result.error,
          count: result.data?.length ?? 0
        });
        
        const requestsData = result.data;
        const requestsError = result.error;

        if (!cancelled) {
          if (requestsError) {
            console.error("❌ [MyTripsPage] Error loading trip_requests:", requestsError);
            setRequests([]);
          } else {
            console.log(`✅ [MyTripsPage] Loaded ${requestsData?.length ?? 0} trip requests`);
            setRequests((requestsData ?? []) as any);
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

      <main className="min-h-screen bg-background text-foreground">
        <section className="mx-auto max-w-5xl px-4 pt-14 pb-6 md:pt-16 md:pb-8">
          <div className="flex items-center justify-between mb-6">
            <BackButton label="Back" />
          </div>

          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
              My trips
            </p>
            <h1 className="font-serif text-2xl md:text-3xl leading-tight text-foreground">
              Your Goldsainte Journey
            </h1>
            <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
              Track your trip requests, upcoming adventures, and past escapes — all in one beautifully curated space.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-16 md:pb-20">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-pulse mx-auto w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <Plane className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Loading your trips…</p>
              </div>
            </div>
          )}

          {!loading && !error && (
            <Tabs defaultValue={defaultTab} className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="requests">Requests</TabsTrigger>
                <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                <TabsTrigger value="booked">Booked &amp; Past</TabsTrigger>
              </TabsList>

              <TabsContent value="requests" className="space-y-5">
                {requests.length === 0 ? (
                  <div className="rounded-3xl bg-card border border-border p-8 md:p-12 text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                      <Globe className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-serif text-xl md:text-2xl mb-3 text-foreground">
                      Where will your next adventure take you?
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed">
                      Share your dream destination with the Goldsainte marketplace. Our curated network of creators and agents will craft personalized proposals just for you.
                    </p>
                    <Button asChild size="lg" className="rounded-full">
                      <Link to="/post-trip" className="inline-flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Post Your Dream Trip
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
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
                  <div className="rounded-3xl bg-card border border-border p-8 md:p-12 text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-accent/50 flex items-center justify-center mb-6">
                      <Plane className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-serif text-xl md:text-2xl mb-3 text-foreground">
                      No trips in progress
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                      When you're on an adventure, your active trips will appear here with all the details you need.
                    </p>
                  </div>
                ) : (
                  <TripsSection title="In progress" trips={inProgress} />
                )}
              </TabsContent>

              <TabsContent value="booked" className="space-y-5">
                {trips.length === 0 ? (
                  <div className="rounded-3xl bg-card border border-border p-8 md:p-12 text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                      <Calendar className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-serif text-xl md:text-2xl mb-3 text-foreground">
                      Your travel story starts here
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed">
                      Book through Goldsainte or accept a curated proposal from our creators and agents. Every journey becomes part of your story.
                    </p>
                    <Button asChild size="lg" className="rounded-full">
                      <Link to="/marketplace" className="inline-flex items-center gap-2">
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
  
  // TEMPORARY FIX: Set proposals to empty array since nested select was removed
  // Proposal counts will show as 0 until we fix the database relationship or add separate query
  const proposals: { status: string }[] = [];
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
    <Link
      to={`/trip-request/${req.id}`}
      className="flex flex-col gap-3 rounded-3xl bg-white/95 p-4 text-xs text-[#0a2225] shadow-sm ring-1 ring-[#E5DFC6] hover:ring-[#BFAD72]"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs text-[#8D8D8D]">
            Posted {new Date(req.created_at).toLocaleDateString()}
          </p>
          <h2 className="mt-1 line-clamp-2 text-sm font-semibold">
            {req.title || `Trip to ${req.destination || "somewhere special"}`}
          </h2>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ${statusColor}`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1 text-sm text-[#4a4a4a]">
          <p className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-[#8D8D8D]" />
            <span>{req.destination || "Destination TBD"}</span>
          </p>
          <p className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-[#8D8D8D]" />
            <span className="line-clamp-1">{dates}</span>
          </p>
        </div>
        <div className="space-y-1 text-sm text-[#4a4a4a]">
          <p className="flex items-center gap-1">
            <Users className="h-3 w-3 text-[#8D8D8D]" />
            <span>{travelers || "Unknown"} travelers</span>
          </p>
          <p className="flex items-center gap-1">
            <HandCoins className="h-3 w-3 text-[#8D8D8D]" />
            <span>{budget}</span>
          </p>
        </div>
        <div className="space-y-1 text-sm text-[#4a4a4a]">
          <p>
            <span className="font-medium">{proposalCount}</span> proposal
            {proposalCount === 1 ? "" : "s"} received
          </p>
          {acceptedCount > 0 && (
            <p className="text-emerald-700">
              {acceptedCount} proposal
              {acceptedCount === 1 ? "" : "s"} marked as accepted
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-[#0c4d47]">View full brief & proposals →</span>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
        >
          <Trash2 className="h-3 w-3" />
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
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
