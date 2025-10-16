import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar, Heart, Settings, Activity, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { BookingCard } from "@/components/dashboard/BookingCard";
import { FavoritesSection } from "@/components/dashboard/FavoritesSection";
import { PreferencesSection } from "@/components/dashboard/PreferencesSection";
import { ActivitySection } from "@/components/dashboard/ActivitySection";

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
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Get initial tab from URL query params
  const initialTab = searchParams.get('tab') || 'bookings';

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      navigate('/auth');
      return;
    }

    fetchUserData();
  }, [user, isLoading, navigate]);

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


  const upcomingBookings = bookings.filter(b => {
    if (b.status === 'cancelled') return false;
    const dateStr = b.booking_data?.departureDate || b.booking_data?.checkIn;
    if (!dateStr) return false;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return false;
    return date > new Date();
  });

  const pastBookings = bookings.filter(b => {
    if (b.status === 'cancelled') return true;
    const dateStr = b.booking_data?.departureDate || b.booking_data?.checkIn;
    if (!dateStr) return false;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return false;
    return date <= new Date();
  });

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
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
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Upcoming</p>
                  <p className="text-2xl font-bold">{upcomingBookings.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Past Bookings</p>
                  <p className="text-2xl font-bold">{pastBookings.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-muted-foreground opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Favorites</p>
                  <p className="text-2xl font-bold">-</p>
                </div>
                <Heart className="h-8 w-8 text-red-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Searches</p>
                  <p className="text-2xl font-bold">{searchHistory.length}</p>
                </div>
                <Activity className="h-8 w-8 text-secondary opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-secondary text-primary mb-2">My Dashboard</h1>
          <p className="text-muted-foreground">Manage your bookings, favorites, preferences and activity</p>
        </div>

        <Tabs value={initialTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl text-xs md:text-sm">
            <TabsTrigger value="bookings" className="px-2 md:px-3">
              Bookings
            </TabsTrigger>
            <TabsTrigger value="favorites" className="px-2 md:px-3">
              Favorites
            </TabsTrigger>
            <TabsTrigger value="preferences" className="px-2 md:px-3">
              Preferences
            </TabsTrigger>
            <TabsTrigger value="activity" className="px-2 md:px-3">
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-4">
            <Tabs defaultValue="upcoming" className="space-y-4">
              <TabsList>
                <TabsTrigger value="upcoming">
                  Upcoming ({upcomingBookings.length})
                </TabsTrigger>
                <TabsTrigger value="past">
                  Past ({pastBookings.length})
                </TabsTrigger>
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
                      <Button onClick={() => navigate('/search')}>
                        Explore Options
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  upcomingBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="past" className="space-y-4">
                {pastBookings.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No past bookings</h3>
                      <p className="text-muted-foreground text-center">
                        Your booking history will appear here
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  pastBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="favorites">
            <FavoritesSection />
          </TabsContent>

          <TabsContent value="preferences">
            <PreferencesSection />
          </TabsContent>

          <TabsContent value="activity">
            <ActivitySection searchHistory={searchHistory} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
