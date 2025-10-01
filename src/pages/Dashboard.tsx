import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { SimpleHeader } from "@/components/SimpleHeader";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, DollarSign, Clock, User, Search, Heart } from "lucide-react";
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
  guests: {
    first_name: string;
    last_name: string;
    email: string;
  };
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
        .select('*, guests(*)')
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
      case 'confirmed': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

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
        <div className="mb-8">
          <h1 className="text-4xl font-chiffon text-primary mb-2">My Dashboard</h1>
          <p className="text-muted-foreground">Manage your bookings and preferences</p>
        </div>

        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="history">Search History</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-4">
            {bookings.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Start exploring and make your first booking
                  </p>
                  <Button onClick={() => navigate('/')}>
                    Explore Options
                  </Button>
                </CardContent>
              </Card>
            ) : (
              bookings.map((booking) => (
                <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl font-chiffon">
                          {booking.booking_type.charAt(0).toUpperCase() + booking.booking_type.slice(1)} Booking
                        </CardTitle>
                        <CardDescription>
                          Ref: {booking.booking_reference}
                        </CardDescription>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {booking.guests.first_name} {booking.guests.last_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-semibold">
                          {booking.currency} {booking.total_price.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {formatDate(booking.created_at)}
                        </span>
                      </div>
                      {booking.booking_data?.hotelName && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {booking.booking_data.hotelName}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {booking.booking_data?.checkInDate && booking.booking_data?.checkOutDate && (
                      <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground">
                          {formatDate(booking.booking_data.checkInDate)} - {formatDate(booking.booking_data.checkOutDate)}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
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

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>
                  Manage your account information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-muted-foreground">{user?.email}</p>
                  </div>
                  
                  <div className="pt-4 border-t space-y-3">
                    <h3 className="font-semibold">Payment Methods</h3>
                    <Button 
                      onClick={async () => {
                        try {
                          const { data, error } = await supabase.functions.invoke('customer-portal');
                          if (error) throw error;
                          if (data?.url) {
                            window.open(data.url, '_blank');
                          }
                        } catch (error: any) {
                          toast.error('Failed to open payment portal');
                        }
                      }}
                      variant="outline" 
                      className="w-full"
                    >
                      Manage Payment Methods
                    </Button>
                  </div>

                  <div className="pt-4 border-t space-y-3">
                    <Button onClick={() => navigate('/favorites')} variant="outline" className="w-full">
                      <Heart className="mr-2 h-4 w-4" />
                      View Favorites
                    </Button>
                    <Button onClick={() => navigate('/marketplace')} variant="outline" className="w-full">
                      Post Complex Booking Job
                    </Button>
                    <Button onClick={() => navigate('/profile')} className="w-full">
                      Edit Profile
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}