import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plane, Hotel, Calendar, Clock, MapPin, DollarSign, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function MyBookings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchBookings();
  }, [user, navigate]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getBookingIcon = (type: string) => {
    switch (type) {
      case 'flight':
        return <Plane className="h-5 w-5" />;
      case 'hotel':
        return <Hotel className="h-5 w-5" />;
      default:
        return <Calendar className="h-5 w-5" />;
    }
  };

  const upcomingBookings = bookings.filter(b => 
    b.status !== 'cancelled' && 
    new Date(b.booking_data?.departureDate || b.booking_data?.checkIn) > new Date()
  );

  const pastBookings = bookings.filter(b => 
    b.status === 'cancelled' ||
    new Date(b.booking_data?.departureDate || b.booking_data?.checkIn) <= new Date()
  );

  const renderBookingCard = (booking: any) => (
    <Card key={booking.id} className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              {getBookingIcon(booking.booking_type)}
            </div>
            <div>
              <CardTitle className="text-lg">
                {booking.booking_type === 'flight' 
                  ? `${booking.booking_data?.origin} → ${booking.booking_data?.destination}`
                  : booking.booking_data?.hotelName || 'Hotel Booking'
                }
              </CardTitle>
              <CardDescription>
                Booking Ref: {booking.booking_reference}
              </CardDescription>
            </div>
          </div>
          <Badge className={getStatusColor(booking.status)}>
            {booking.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              {format(new Date(booking.booking_data?.departureDate || booking.booking_data?.checkIn), 'MMM dd, yyyy')}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              {booking.booking_data?.departureTime || booking.booking_data?.checkInTime || 'N/A'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">
              {booking.currency} {Number(booking.total_price).toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{booking.booking_data?.destination}</span>
          </div>
        </div>
        
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => navigate(`/booking-details/${booking.id}`)}
          >
            View Details
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
          {booking.status !== 'cancelled' && booking.booking_type === 'flight' && (
            <Button 
              variant="default" 
              onClick={() => navigate(`/booking-details/${booking.id}?action=modify`)}
            >
              Modify Booking
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">My Bookings</h1>
          <p className="text-muted-foreground mb-8">
            Manage your travel reservations and bookings
          </p>

          <Tabs defaultValue="upcoming" className="space-y-6">
            <TabsList>
              <TabsTrigger value="upcoming">
                Upcoming ({upcomingBookings.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Past & Cancelled ({pastBookings.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4">
              {upcomingBookings.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">No upcoming bookings</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Start planning your next adventure
                    </p>
                    <Button onClick={() => navigate('/')}>
                      Browse Destinations
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                upcomingBookings.map(renderBookingCard)
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4">
              {pastBookings.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">No past bookings</p>
                    <p className="text-sm text-muted-foreground">
                      Your booking history will appear here
                    </p>
                  </CardContent>
                </Card>
              ) : (
                pastBookings.map(renderBookingCard)
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}