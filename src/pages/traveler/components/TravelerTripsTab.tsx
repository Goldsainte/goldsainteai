import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapPin, Calendar, Users, ArrowRight, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

interface TripRequest {
  id: string;
  title: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  travelers_adults: number | null;
  travelers_children: number | null;
  status: string;
  created_at: string;
}

interface TravelerTripsTabProps {
  userId: string;
}

export function TravelerTripsTab({ userId }: TravelerTripsTabProps) {
  const [activeTab, setActiveTab] = useState("active");
  const [tripRequests, setTripRequests] = useState<TripRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTripRequests = async () => {
      const { data, error } = await supabase
        .from("trip_requests")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setTripRequests(data);
      }
      setLoading(false);
    };

    if (userId) {
      fetchTripRequests();
    }
  }, [userId]);

  const activeRequests = tripRequests.filter((t) => t.status === "open" || t.status === "pending");
  const inProgressRequests = tripRequests.filter((t) => t.status === "in_progress" || t.status === "matched");
  const completedRequests = tripRequests.filter((t) => t.status === "completed" || t.status === "cancelled");

  const formatDate = (date: string | null) => {
    if (!date) return "Flexible";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getTravelerCount = (adults: number | null, children: number | null) => {
    const total = (adults || 0) + (children || 0);
    return total || 1;
  };

  const TripCard = ({ trip }: { trip: TripRequest }) => (
    <Card className="bg-white border-[#E5DFC6] rounded-2xl hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                trip.status === "open" ? "bg-[#E0F3E4] text-[#295C3B]" :
                trip.status === "in_progress" ? "bg-[#FEF3C7] text-[#92400E]" :
                trip.status === "completed" ? "bg-[#E0E6F3] text-[#384B7A]" :
                "bg-[#F3F4F6] text-[#6B7280]"
              }`}>
                {trip.status === "open" ? "Open" :
                 trip.status === "in_progress" ? "In Progress" :
                 trip.status === "completed" ? "Completed" :
                 trip.status}
              </span>
            </div>
            
            <h3 className="font-secondary text-lg text-[#0a2225]">{trip.title}</h3>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-[#6B7280]">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-[#C7A962]" />
                {trip.destination}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-[#C7A962]" />
                {formatDate(trip.start_date)}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-[#C7A962]" />
                {getTravelerCount(trip.travelers_adults, trip.travelers_children)} travelers
              </span>
            </div>
          </div>
          
          <Link
            to={`/trip-request/${trip.id}`}
            className="text-[#0a2225] hover:text-[#C7A962] transition-colors"
          >
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );

  const EmptyState = ({ message, showCTA = true }: { message: string; showCTA?: boolean }) => (
    <div className="text-center py-12 px-4">
      <h3 className="font-secondary text-xl text-[#0a2225] mb-2">{message}</h3>
      <p className="text-[#6B7280] mb-6 text-sm">Your dream destination is waiting to be discovered.</p>
      {showCTA && (
        <Button asChild className="bg-[#0c4d47] hover:bg-[#0a2225] text-[#f7f3ea] rounded-full px-6 h-11">
          <Link to="/post-trip">
            <Plus className="h-4 w-4 mr-2" />
            Request a Trip
          </Link>
        </Button>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-[#F6F0E4] rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs + CTA row */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <TabsList className="bg-[#F6F0E4] p-1 rounded-full w-full sm:w-auto grid grid-cols-3 sm:flex h-auto">
            <TabsTrigger
              value="active"
              className="rounded-full px-2 sm:px-5 py-2 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-[#0a2225] data-[state=active]:shadow-sm"
            >
              Active ({activeRequests.length})
            </TabsTrigger>
            <TabsTrigger
              value="in-progress"
              className="rounded-full px-2 sm:px-5 py-2 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-[#0a2225] data-[state=active]:shadow-sm"
            >
              In Progress ({inProgressRequests.length})
            </TabsTrigger>
            <TabsTrigger
              value="past"
              className="rounded-full px-2 sm:px-5 py-2 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-[#0a2225] data-[state=active]:shadow-sm"
            >
              Past ({completedRequests.length})
            </TabsTrigger>
          </TabsList>
          <Button asChild size="sm" className="hidden sm:inline-flex bg-[#0c4d47] hover:bg-[#0a2225] text-[#f7f3ea] rounded-full px-5">
            <Link to="/post-trip">
              <Plus className="h-4 w-4 mr-2" />
              Request a Trip
            </Link>
          </Button>
        </div>

        <TabsContent value="active" className="mt-6 space-y-4">
          {activeRequests.length > 0 ? (
            activeRequests.map((trip) => <TripCard key={trip.id} trip={trip} />)
          ) : (
            <EmptyState message="No active trip requests" />
          )}
        </TabsContent>

        <TabsContent value="in-progress" className="mt-6 space-y-4">
          {inProgressRequests.length > 0 ? (
            inProgressRequests.map((trip) => <TripCard key={trip.id} trip={trip} />)
          ) : (
            <EmptyState message="No trips in progress" showCTA={false} />
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6 space-y-4">
          {completedRequests.length > 0 ? (
            completedRequests.map((trip) => <TripCard key={trip.id} trip={trip} />)
          ) : (
            <EmptyState message="No past trips yet" showCTA={false} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
