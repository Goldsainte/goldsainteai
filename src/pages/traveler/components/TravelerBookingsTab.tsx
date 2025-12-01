import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapPin, Calendar, CreditCard, ArrowRight, Plane } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

interface Booking {
  id: string;
  status: string;
  total_price_cents: number | null;
  currency: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  trip_requests?: {
    title: string;
    destination: string;
  } | null;
}

interface TravelerBookingsTabProps {
  userId: string;
}

export function TravelerBookingsTab({ userId }: TravelerBookingsTabProps) {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      const { data, error } = await supabase
        .from("trip_bookings")
        .select(`
          *,
          trip_requests (
            title,
            destination
          )
        `)
        .eq("traveler_id", userId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setBookings(data.map(mapBooking));
      }
      setLoading(false);
    };

    if (userId) {
      fetchBookings();
    }
  }, [userId]);

  const today = new Date();
  const upcomingBookings = bookings.filter((b) => {
    if (!b.start_date) return b.status === "confirmed" || b.status === "pending";
    return new Date(b.start_date) >= today;
  });
  const pastBookings = bookings.filter((b) => {
    if (!b.start_date) return b.status === "completed";
    return new Date(b.start_date) < today || b.status === "completed";
  });

  const formatDate = (date: string | null) => {
    if (!date) return "TBD";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number | null, currency: string | null) => {
    if (!amount) return "Price TBD";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount / 100);
  };

  // Map DB response to our interface
  const mapBooking = (data: any): Booking => ({
    id: data.id,
    status: data.status,
    total_price_cents: data.total_price_cents,
    currency: data.currency,
    start_date: data.start_date,
    end_date: data.end_date,
    created_at: data.created_at,
    trip_requests: data.trip_requests,
  });

  const BookingCard = ({ booking }: { booking: Booking }) => (
    <Card className="bg-white border-[#E5DFC6] rounded-2xl hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                booking.status === "confirmed" ? "bg-[#E0F3E4] text-[#295C3B]" :
                booking.status === "pending" ? "bg-[#FEF3C7] text-[#92400E]" :
                booking.status === "completed" ? "bg-[#E0E6F3] text-[#384B7A]" :
                "bg-[#F3F4F6] text-[#6B7280]"
              }`}>
                {booking.status === "confirmed" ? "Confirmed" :
                 booking.status === "pending" ? "Pending" :
                 booking.status === "completed" ? "Completed" :
                 booking.status}
              </span>
            </div>
            
            <h3 className="font-secondary text-lg text-[#0a2225]">
              {booking.trip_requests?.title || "Trip Booking"}
            </h3>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-[#6B7280]">
              {booking.trip_requests?.destination && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-[#C7A962]" />
                  {booking.trip_requests.destination}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-[#C7A962]" />
                {formatDate(booking.start_date)}
              </span>
              <span className="flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-[#C7A962]" />
                {formatCurrency(booking.total_price_cents, booking.currency)}
              </span>
            </div>
          </div>
          
          <Link
            to={`/booking/${booking.id}`}
            className="text-[#0a2225] hover:text-[#C7A962] transition-colors"
          >
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F6F0E4] flex items-center justify-center">
        <Plane className="h-8 w-8 text-[#C7A962]" />
      </div>
      <h3 className="font-secondary text-xl text-[#0a2225] mb-2">{message}</h3>
      <p className="text-[#6B7280] mb-6">Start by posting a trip request and connecting with travel experts.</p>
      <Button asChild className="bg-[#0a2225] hover:bg-[#0a2225]/90 text-white rounded-full px-6">
        <Link to="/marketplace">
          Explore Marketplace
        </Link>
      </Button>
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
      {/* Header */}
      <div>
        <p className="text-xs text-[#C7A962] font-medium tracking-wider uppercase">Your Journeys</p>
        <h2 className="font-secondary text-2xl text-[#0a2225] mt-1">Bookings</h2>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[#F6F0E4] p-1 rounded-full w-full md:w-auto">
          <TabsTrigger
            value="upcoming"
            className="rounded-full px-6 data-[state=active]:bg-white data-[state=active]:text-[#0a2225] data-[state=active]:shadow-sm"
          >
            Upcoming ({upcomingBookings.length})
          </TabsTrigger>
          <TabsTrigger
            value="past"
            className="rounded-full px-6 data-[state=active]:bg-white data-[state=active]:text-[#0a2225] data-[state=active]:shadow-sm"
          >
            Past ({pastBookings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6 space-y-4">
          {upcomingBookings.length > 0 ? (
            upcomingBookings.map((booking) => <BookingCard key={booking.id} booking={booking} />)
          ) : (
            <EmptyState message="No upcoming bookings" />
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6 space-y-4">
          {pastBookings.length > 0 ? (
            pastBookings.map((booking) => <BookingCard key={booking.id} booking={booking} />)
          ) : (
            <EmptyState message="No past bookings yet" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
