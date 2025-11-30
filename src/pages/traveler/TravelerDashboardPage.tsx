import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getMyTrips } from "@/services/tripService";
import { getMyTravelerBookingsDetailed } from "@/services/bookingService";
import { 
  Sparkles, Plane, Calendar, ArrowRight, MapPin, Plus, 
  Bookmark, MessageCircle 
} from "lucide-react";
import { useRequireOnboarding } from "@/hooks/useRequireOnboarding";

interface CollectionRow {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  tags: string[] | null;
  brand_profile_id: string | null;
  collection_stats?: {
    views_count: number;
    saves_count: number;
    trip_inquiries_count: number;
  } | null;
}

interface TripInMotion {
  id: string;
  destination: string | null;
  status: string | null;
  date_range: string | null;
  created_at: string;
  assigned_creator_name?: string | null;
  assigned_agent_name?: string | null;
}

export default function TravelerDashboardPage() {
  const { checking, allowed } = useRequireOnboarding();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [collections, setCollections] = useState<CollectionRow[]>([]);
  const [tripsInMotion, setTripsInMotion] = useState<TripInMotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        sessionStorage.setItem('returnTo', '/traveler');
        navigate("/auth?returnTo=/traveler", { replace: true });
        return;
      }

      try {
        // Fetch all data in parallel
        const [myTrips, myBookings, collectionsResult, tripsResult] = await Promise.all([
          getMyTrips(),
          getMyTravelerBookingsDetailed(),
          supabase
            .from("brand_collections")
            .select("id, title, description, cover_image_url, tags, brand_profile_id")
            .eq("is_published", true)
            .order("created_at", { ascending: false })
            .limit(6),
          supabase
            .from("trip_requests")
            .select(
              "id, destination, status, date_range, created_at, assignments:trip_assignments(assignee_profile_id, role, profiles(full_name))"
            )
            .eq("user_id", authUser.id)
            .order("created_at", { ascending: false })
            .limit(6),
        ]);

        if (!cancelled) {
          setTrips(myTrips);
          setBookings(myBookings);
          setCollections((collectionsResult.data ?? []) as CollectionRow[]);
          
          // Map trips in motion with assignments
          const mappedTrips: TripInMotion[] = (tripsResult.data ?? []).map((row: any) => {
            const creator = row.assignments?.find((a: any) => a.role === "creator");
            const agent = row.assignments?.find((a: any) => a.role === "agent");
            return {
              id: row.id,
              destination: row.destination,
              status: row.status,
              date_range: row.date_range,
              created_at: row.created_at,
              assigned_creator_name: creator?.profiles?.full_name,
              assigned_agent_name: agent?.profiles?.full_name,
            };
          });
          setTripsInMotion(mappedTrips);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error(err);
          setError(err.message || "Could not load traveler dashboard.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  // Filter active trips (not completed/cancelled)
  const activeTripsInMotion = useMemo(() => {
    return tripsInMotion.filter(
      (t) => t.status && !["completed", "cancelled"].includes(t.status)
    );
  }, [tripsInMotion]);

  if (checking || !allowed) {
    return (
      <main className="min-h-screen bg-[#FDF9F0] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#C7A962] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-[#6B7280] font-secondary">Preparing your journey hub...</p>
        </div>
      </main>
    );
  }

  const heroCTA = user ? "/concierge" : "/auth?returnTo=/concierge";

  return (
    <main className="min-h-screen bg-[#FDF9F0]">
      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16 space-y-10">
        {/* Header Section */}
        <header>
          <div className="w-16 h-0.5 bg-[#C7A962] mb-6" />
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="space-y-3">
              <p className="inline-flex items-center gap-2 text-xs text-[#C7A962] font-medium tracking-wider uppercase">
                <Sparkles className="h-3.5 w-3.5" />
                Your Journey Hub
              </p>
              <h1 className="font-secondary text-3xl md:text-4xl text-[#0a2225]">
                Where are we taking you next?
              </h1>
              <p className="text-base text-[#6B7280] max-w-xl leading-relaxed">
                Start with a collection that feels like you, then let Madison and our creators turn it into a real trip.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/post-trip")}
                className="inline-flex items-center gap-2 rounded-full bg-[#0a2225] text-white px-6 py-3 text-sm font-medium hover:bg-[#0a2225]/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Post a Trip
              </button>
              <Link
                to={heroCTA}
                className="inline-flex items-center gap-2 rounded-full border border-[#E5DFC6] bg-white text-[#0a2225] px-6 py-3 text-sm font-medium hover:bg-[#F6F0E4] transition-colors"
              >
                <MessageCircle className="h-4 w-4 text-[#C7A962]" />
                Ask Madison
              </Link>
            </div>
          </div>
        </header>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-6 py-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white border border-[#E5DFC6] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#FDF9F0] flex items-center justify-center">
                <Calendar className="h-5 w-5 text-[#C7A962]" />
              </div>
              <div>
                <p className="font-secondary text-2xl text-[#0a2225]">{trips.length}</p>
                <p className="text-sm text-[#6B7280]">Trip Requests</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-[#E5DFC6] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#FDF9F0] flex items-center justify-center">
                <Plane className="h-5 w-5 text-[#C7A962]" />
              </div>
              <div>
                <p className="font-secondary text-2xl text-[#0a2225]">{bookings.length}</p>
                <p className="text-sm text-[#6B7280]">Confirmed Bookings</p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-[#C7A962] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-[#6B7280]">Loading your trips and bookings...</p>
          </div>
        )}

        {!loading && (
          <>
            {/* Collections For You Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-[#C7A962] font-medium tracking-wider uppercase">For you</p>
                  <h2 className="font-secondary text-xl text-[#0a2225]">Collections we'd start with</h2>
                </div>
                <Link
                  to="/collections"
                  className="inline-flex items-center gap-1 text-sm text-[#0a2225] hover:text-[#C7A962] transition-colors"
                >
                  Browse all
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              
              {collections.length === 0 ? (
                <div className="bg-white border border-[#E5DFC6] rounded-2xl p-6 text-center">
                  <p className="text-sm text-[#6B7280]">
                    We're curating your recommendations. Check back soon.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-3">
                  {collections.map((collection) => (
                    <div 
                      key={collection.id} 
                      className="bg-white border border-[#E5DFC6] rounded-2xl overflow-hidden hover:border-[#C7A962] transition-colors group"
                    >
                      {collection.cover_image_url && (
                        <div className="h-36 w-full overflow-hidden bg-[#F5F0E0]">
                          <img
                            src={collection.cover_image_url}
                            alt={collection.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <div className="p-5 space-y-3">
                        <h3 className="font-secondary text-lg text-[#0a2225] group-hover:text-[#C7A962] transition-colors">
                          {collection.title}
                        </h3>
                        <p className="text-sm text-[#6B7280] line-clamp-2">
                          {collection.description ?? "Modern luxury, crafted for you."}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {(collection.tags ?? []).slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-[#FDF9F0] px-3 py-1 text-xs text-[#6B7280]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <Link
                          to={collection.brand_profile_id 
                            ? `/brands/${collection.brand_profile_id}/collections/${collection.id}`
                            : `/marketplace`}
                          className="inline-flex items-center gap-1 text-sm text-[#C7A962] hover:underline"
                        >
                          Open collection
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Trips in Motion Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-[#C7A962] font-medium tracking-wider uppercase">Continue planning</p>
                  <h2 className="font-secondary text-xl text-[#0a2225]">Trips in motion</h2>
                </div>
                <Link
                  to="/trips"
                  className="inline-flex items-center gap-1 text-sm text-[#0a2225] hover:text-[#C7A962] transition-colors"
                >
                  View all
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {activeTripsInMotion.length === 0 ? (
                <div className="bg-white border border-dashed border-[#E5DFC6] rounded-2xl p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <p className="text-sm text-[#6B7280]">No active trips yet. Start with a collection you love.</p>
                    <div className="flex gap-2">
                      <Link
                        to="/collections"
                        className="inline-flex items-center gap-1 rounded-full bg-[#0a2225] text-white px-4 py-2 text-sm font-medium hover:bg-[#0a2225]/90 transition-colors"
                      >
                        Explore collections
                      </Link>
                      <Link
                        to={heroCTA}
                        className="inline-flex items-center gap-1 rounded-full border border-[#E5DFC6] bg-white text-[#0a2225] px-4 py-2 text-sm font-medium hover:bg-[#F6F0E4] transition-colors"
                      >
                        Ask Madison
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {activeTripsInMotion.map((trip) => (
                    <Link
                      key={trip.id}
                      to={`/trip/${trip.id}`}
                      className="bg-white border border-[#E5DFC6] rounded-2xl p-5 hover:border-[#C7A962] transition-colors group"
                    >
                      <div className="flex items-center justify-between text-xs text-[#6B7280] mb-2">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#FDF9F0] text-[#C7A962] font-medium uppercase tracking-wide">
                          {trip.status ?? "new"}
                        </span>
                        <span>{new Date(trip.created_at).toLocaleDateString()}</span>
                      </div>
                      <h3 className="font-secondary text-lg text-[#0a2225] group-hover:text-[#C7A962] transition-colors">
                        {trip.destination || "Destination TBD"}
                      </h3>
                      <p className="text-sm text-[#6B7280] mt-1">{trip.date_range || "Flexible dates"}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {trip.assigned_creator_name && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FDF9F0] px-3 py-1 text-xs text-[#6B7280]">
                            <Sparkles className="h-3 w-3 text-[#C7A962]" /> {trip.assigned_creator_name}
                          </span>
                        )}
                        {trip.assigned_agent_name && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FDF9F0] px-3 py-1 text-xs text-[#6B7280]">
                            <MapPin className="h-3 w-3 text-[#C7A962]" /> {trip.assigned_agent_name}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Main Content Grid - Trip Requests & Bookings */}
            <div className="grid gap-8 md:grid-cols-2">
              {/* Trip Requests Section */}
              <section className="bg-white border border-[#E5DFC6] rounded-2xl p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[#FDF9F0] flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-[#C7A962]" />
                  </div>
                  <div>
                    <h2 className="font-secondary text-xl text-[#0a2225]">Trip Requests</h2>
                    <p className="text-sm text-[#6B7280]">Your dream journeys in progress</p>
                  </div>
                </div>

                {trips.length === 0 ? (
                  <div className="text-center py-10 px-4">
                    <div className="w-16 h-16 rounded-full bg-[#FDF9F0] flex items-center justify-center mx-auto mb-4">
                      <MapPin className="h-6 w-6 text-[#C7A962]" />
                    </div>
                    <p className="font-secondary text-lg text-[#0a2225] mb-2">No trips yet</p>
                    <p className="text-sm text-[#6B7280] mb-6 max-w-xs mx-auto">
                      Start by posting your first trip request and let our curators craft your perfect journey.
                    </p>
                    <button
                      onClick={() => navigate("/post-trip")}
                      className="inline-flex items-center gap-2 text-sm text-[#C7A962] font-medium hover:underline"
                    >
                      Post your first trip
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {trips.map((trip) => (
                      <button
                        key={trip.id}
                        onClick={() => navigate(`/trip/${trip.id}`)}
                        className="w-full text-left bg-[#FDF9F0] border border-[#E5DFC6] rounded-xl px-5 py-4 hover:border-[#C7A962] transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-secondary text-base text-[#0a2225] truncate group-hover:text-[#C7A962] transition-colors">
                              {trip.title || "Untitled Trip"}
                            </p>
                            <p className="text-sm text-[#6B7280] mt-1">
                              {trip.destination || "Destination TBD"}
                            </p>
                            <p className="text-xs text-[#9CA3AF] mt-2">
                              {new Date(trip.created_at).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}
                            </p>
                          </div>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white border border-[#E5DFC6] text-[#C7A962] capitalize">
                            {trip.status}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </section>

              {/* Bookings Section */}
              <section className="bg-white border border-[#E5DFC6] rounded-2xl p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[#FDF9F0] flex items-center justify-center">
                    <Plane className="h-4 w-4 text-[#C7A962]" />
                  </div>
                  <div>
                    <h2 className="font-secondary text-xl text-[#0a2225]">Confirmed Bookings</h2>
                    <p className="text-sm text-[#6B7280]">Your upcoming adventures</p>
                  </div>
                </div>

                {bookings.length === 0 ? (
                  <div className="text-center py-10 px-4">
                    <div className="w-16 h-16 rounded-full bg-[#FDF9F0] flex items-center justify-center mx-auto mb-4">
                      <Plane className="h-6 w-6 text-[#C7A962]" />
                    </div>
                    <p className="font-secondary text-lg text-[#0a2225] mb-2">No bookings yet</p>
                    <p className="text-sm text-[#6B7280] max-w-xs mx-auto">
                      Once you accept a proposal and complete payment, your confirmed bookings will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {bookings.map((booking) => (
                      <button
                        key={booking.id}
                        onClick={() => navigate(`/booking/${booking.id}`)}
                        className="w-full text-left bg-[#FDF9F0] border border-[#E5DFC6] rounded-xl px-5 py-4 hover:border-[#C7A962] transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-secondary text-base text-[#0a2225] truncate group-hover:text-[#C7A962] transition-colors">
                              {booking.trips?.title || "Trip Booking"}
                            </p>
                            <p className="text-sm text-[#6B7280] mt-1">
                              {booking.trips?.destination || "Destination TBD"}
                            </p>
                            <p className="text-xs text-[#9CA3AF] mt-2">
                              {new Date(booking.created_at).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            {booking.total_amount && (
                              <p className="font-secondary text-lg text-[#C7A962]">
                                {booking.currency || "USD"} {booking.total_amount.toLocaleString()}
                              </p>
                            )}
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white border border-[#E5DFC6] text-[#6B7280] capitalize mt-1">
                              {booking.status}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Editorial CTA Section */}
            <section className="bg-gradient-to-br from-[#FDF9F0] to-[#F6F0E4] border border-[#E5DFC6] rounded-2xl p-8 md:p-10">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="space-y-3 max-w-xl">
                  <p className="text-xs text-[#C7A962] font-medium tracking-wider uppercase">
                    What's Next
                  </p>
                  <h3 className="font-secondary text-2xl text-[#0a2225]">
                    Ready to turn your next inspiration into a real journey?
                  </h3>
                  <p className="text-base text-[#6B7280] leading-relaxed">
                    Use the Creator Lab to pair your favorite travel content with Goldsainte 
                    agents — then see everything land back here in your dashboard.
                  </p>
                </div>
                <Link
                  to="/tiktok-lab"
                  className="inline-flex items-center gap-2 rounded-full bg-[#0a2225] text-white px-6 py-3 text-sm font-medium hover:bg-[#0a2225]/90 transition-colors whitespace-nowrap"
                >
                  Open Creator Lab
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
