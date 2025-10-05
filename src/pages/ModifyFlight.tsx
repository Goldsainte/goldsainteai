import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, Plane, Calendar as CalendarIcon, Search, Loader2, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ModifyFlight() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [modifying, setModifying] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  // Search form state
  const [departureDate, setDepartureDate] = useState<Date>();
  const [cabinClass, setCabinClass] = useState("economy");
  const [adults, setAdults] = useState("1");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/auth');
      return;
    }
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [user, authLoading, bookingId, navigate]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setBooking(data);
      
      // Pre-fill form with current booking details
      const bookingData = data.booking_data as any;
      if (bookingData?.departureDate) {
        setDepartureDate(new Date(bookingData.departureDate));
      }
      if (bookingData?.cabinClass) {
        setCabinClass(bookingData.cabinClass);
      }
    } catch (error: any) {
      console.error('Error fetching booking:', error);
      toast.error('Failed to load booking details');
      navigate('/my-bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchAlternatives = async () => {
    if (!departureDate || !booking) {
      toast.error('Please select a departure date');
      return;
    }

    try {
      setSearching(true);
      
      const { data, error } = await supabase.functions.invoke('amadeus-search-flights', {
        body: {
          origin: (booking.booking_data as any).origin,
          destination: (booking.booking_data as any).destination,
          departureDate: format(departureDate, 'yyyy-MM-dd'),
          adults: parseInt(adults),
          cabinClass: cabinClass.toUpperCase(),
          max: 10,
        },
      });

      if (error) throw error;
      
      if (data?.flights && data.flights.length > 0) {
        setSearchResults(data.flights);
        toast.success(`Found ${data.flights.length} alternative flights`);
      } else {
        toast.info('No alternative flights found');
        setSearchResults([]);
      }
    } catch (error: any) {
      console.error('Error searching flights:', error);
      toast.error('Failed to search for alternative flights');
    } finally {
      setSearching(false);
    }
  };

  const handleModifyBooking = async (newFlight: any) => {
    if (!bookingId || !booking) return;

    try {
      setModifying(true);

      const { data, error } = await supabase.functions.invoke('amadeus-modify-flight', {
        body: {
          bookingId,
          currentBookingData: booking.booking_data,
          newFlightData: newFlight,
        },
      });

      if (error) throw error;

      const fareDiff = data.fareDifference || 0;
      const changeFee = data.changeFee || 0;
      const total = fareDiff + changeFee;

      if (total > 0) {
        toast.success(`Flight modified! Additional charge: $${total.toFixed(2)}`);
      } else if (total < 0) {
        toast.success(`Flight modified! Credit issued: $${Math.abs(total).toFixed(2)}`);
      } else {
        toast.success('Flight modified successfully!');
      }

      navigate(`/booking-details/${bookingId}`);
    } catch (error: any) {
      console.error('Error modifying flight:', error);
      toast.error(error.message || 'Failed to modify flight');
    } finally {
      setModifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!booking) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/booking-details/${bookingId}`)}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Booking Details
          </Button>

          <h1 className="text-3xl font-bold mb-6">Modify Flight</h1>

          {/* Current Booking Card */}
          <Card className="mb-6 border-2 border-primary/20">
            <CardHeader>
              <CardTitle>Current Booking</CardTitle>
              <CardDescription>Confirmation: {booking.booking_reference}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-2xl font-bold">{(booking.booking_data as any).origin}</p>
                  <p className="text-sm text-muted-foreground">{(booking.booking_data as any).originAirport}</p>
                </div>
                <div className="flex-1 mx-4 flex items-center justify-center">
                  <Plane className="h-6 w-6 text-muted-foreground" />
                  <div className="h-px flex-1 bg-border mx-2" />
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{(booking.booking_data as any).destination}</p>
                  <p className="text-sm text-muted-foreground">{(booking.booking_data as any).destinationAirport}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Current Date</p>
                  <p className="font-semibold">
                    {format(new Date((booking.booking_data as any).departureDate), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Cabin Class</p>
                  <p className="font-semibold">{(booking.booking_data as any).cabinClass || 'Economy'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search Form */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Search Alternative Flights</CardTitle>
              <CardDescription>Find a new flight for the same route</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>New Departure Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !departureDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {departureDate ? format(departureDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={departureDate}
                        onSelect={setDepartureDate}
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Cabin Class</Label>
                  <Select value={cabinClass} onValueChange={setCabinClass}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="economy">Economy</SelectItem>
                      <SelectItem value="premium_economy">Premium Economy</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="first">First Class</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleSearchAlternatives}
                disabled={searching || !departureDate}
                className="w-full"
              >
                {searching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search Alternative Flights
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Available Flights</h2>
              {searchResults.map((flight: any, index: number) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-semibold text-lg">
                          {flight.itineraries[0].segments[0].departure.iataCode} → {flight.itineraries[0].segments[flight.itineraries[0].segments.length - 1].arrival.iataCode}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {flight.validatingAirlineCodes?.[0]} • {flight.itineraries[0].segments.length} stop(s)
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">${flight.price.total}</p>
                        <p className="text-sm text-muted-foreground">{flight.price.currency}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm mb-4">
                      <div>
                        <p className="font-semibold">{flight.itineraries[0].segments[0].departure.at.split('T')[1].slice(0, 5)}</p>
                        <p className="text-muted-foreground">{format(new Date(flight.itineraries[0].segments[0].departure.at), 'MMM dd')}</p>
                      </div>
                      <div className="flex-1 mx-4 text-center">
                        <p className="text-muted-foreground">{flight.itineraries[0].duration.replace('PT', '').toLowerCase()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{flight.itineraries[0].segments[flight.itineraries[0].segments.length - 1].arrival.at.split('T')[1].slice(0, 5)}</p>
                        <p className="text-muted-foreground">{format(new Date(flight.itineraries[0].segments[flight.itineraries[0].segments.length - 1].arrival.at), 'MMM dd')}</p>
                      </div>
                    </div>

                    <Button 
                      onClick={() => handleModifyBooking(flight)}
                      disabled={modifying}
                      className="w-full"
                    >
                      {modifying ? 'Processing...' : 'Select This Flight'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}