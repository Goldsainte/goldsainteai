import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { SimpleHeader } from "@/components/SimpleHeader";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, DollarSign, Clock, Search, Plane, Hotel, ChevronRight, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Booking {
  id: string;
  booking_reference: string;
  booking_type: string;
  status: string;
  total_price: number;
  currency: string;
  booking_data: any;
  created_at: string;
}

interface SearchHistory {
  id: string;
  search_type: string;
  search_params: any;
  created_at: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    fetchUserData();
  }, [user, navigate]);

  const fetchUserData = async () => {
    try {
      setLoading(true);

      // Fetch bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;
      setBookings(bookingsData || []);

      // Fetch search history
      const { data: historyData, error: historyError } = await supabase
        .from('search_history')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (historyError) throw historyError;
      setSearchHistory(historyData || []);

    } catch (error: any) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
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

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const upcomingBookings = bookings.filter(b => 
    b.status !== 'cancelled' && 
    new Date(b.booking_data?.departureDate || b.booking_data?.checkIn) > new Date()
  );

  const pastBookings = bookings.filter(b => 
    b.status === 'cancelled' ||
    new Date(b.booking_data?.departureDate || b.booking_data?.checkIn) <= new Date()
  );

  const renderBookingCard = (booking: Booking) => (
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
                Ref: {booking.booking_reference}
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
              {formatDate(booking.booking_data?.departureDate || booking.booking_data?.checkIn)}
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
              onClick={() => navigate(`/modify-flight/${booking.id}`)}
            >
              Modify Flight
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SimpleHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SimpleHeader />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
        
        <div className="mb-8">
          <h1 className="text-4xl font-chiffon text-primary mb-2">My Dashboard</h1>
          <p className="text-muted-foreground">Manage your bookings and activity</p>
        </div>

        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-xl">
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({pastBookings.length})
            </TabsTrigger>
            <TabsTrigger value="history">Search History</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingBookings.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No upcoming bookings</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Start planning your next adventure
                  </p>
                  <Button onClick={() => navigate('/')}>
                    Explore Options
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
                  <Clock className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No past bookings</h3>
                  <p className="text-muted-foreground text-center">
                    Your booking history will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              pastBookings.map(renderBookingCard)
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {searchHistory.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Search className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No search history</h3>
                  <p className="text-muted-foreground text-center">
                    Your recent searches will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              searchHistory.map((search) => (
                <Card key={search.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Search className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {search.search_type.charAt(0).toUpperCase() + search.search_type.slice(1)} Search
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(search.created_at)}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Search Again
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
