import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plane, Hotel, MapPin, UtensilsCrossed, Search, Send, Loader2, Sparkles, ArrowLeft, MapPinned, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { SimplePropertyCard } from "@/components/SimplePropertyCard";
import { InspirationCard } from "@/components/InspirationCard";
import { RestaurantCard } from "@/components/RestaurantCard";
import { FlightCard } from "@/components/FlightCard";
import { ChatDatePicker } from "@/components/ChatDatePicker";
import { HotelFilters } from "@/components/HotelFilters";
import { FlightFilters } from "@/components/FlightFilters";
import logomark from "@/assets/logomark-gold.png";
import property1 from "@/assets/property1.jpg";
import property2 from "@/assets/property2.jpg";
import property3 from "@/assets/property3.jpg";
import property4 from "@/assets/property4.jpg";
import property5 from "@/assets/property5.jpg";
import property6 from "@/assets/property6.jpg";
import restaurant1 from "@/assets/restaurant1.jpg";
import restaurant2 from "@/assets/restaurant2.jpg";
import restaurant3 from "@/assets/restaurant3.jpg";
import flight1 from "@/assets/flight1.jpg";
import flight2 from "@/assets/flight2.jpg";
import flight3 from "@/assets/flight3.jpg";
import destination7 from "@/assets/destination7.jpg";
import destination8 from "@/assets/destination8.jpg";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface SearchResult {
  type: string;
  results: any[];
  location?: any;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  filters?: any;
  origin?: { code: string; name: string };
  destination?: { code: string; name: string };
  departureDate?: string;
  returnDate?: string;
  dictionaries?: any;
  meta?: any;
}

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<{ type: "hotel" | "flight"; context: string } | null>(null);
  const [pendingFlightDates, setPendingFlightDates] = useState<{ departureDate: string; returnDate?: string } | null>(null);

  // Get user's current location on mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          console.log('Location detected:', position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.log("User denied location access or error:", error);
          // Silently fall back - user can still search without location
        }
      );
    }
  }, []);

  const inspirationDestinations = [
    {
      image: property1,
      title: "Santorini Paradise",
      location: "Greece",
      description: "Experience breathtaking sunsets and pristine white architecture overlooking the Aegean Sea."
    },
    {
      image: property2,
      title: "Alpine Luxury",
      location: "Swiss Alps",
      description: "Discover world-class skiing and cozy mountain retreats in the heart of the Alps."
    },
    {
      image: property3,
      title: "Tropical Escape",
      location: "Maldives",
      description: "Unwind in overwater bungalows surrounded by crystal-clear turquoise waters."
    },
    {
      image: property4,
      title: "Urban Elegance",
      location: "Paris, France",
      description: "Immerse yourself in art, culture, and world-renowned cuisine in the City of Light."
    },
    {
      image: property5,
      title: "Desert Oasis",
      location: "Dubai, UAE",
      description: "Experience luxury redefined with stunning architecture and endless entertainment."
    },
    {
      image: property6,
      title: "Coastal Charm",
      location: "Amalfi Coast, Italy",
      description: "Explore picturesque villages, stunning cliffs, and authentic Italian hospitality."
    },
    {
      image: destination7,
      title: "Northern Lights",
      location: "Iceland",
      description: "Witness the magical aurora borealis in a winter wonderland of natural beauty."
    },
    {
      image: destination8,
      title: "Bali Serenity",
      location: "Bali, Indonesia",
      description: "Find peace in lush rice terraces and traditional temples with world-class hospitality."
    }
  ];

  const featuredRestaurants = [
    {
      image: restaurant1,
      title: "Maison d'Or",
      cuisine: "French Fine Dining",
      rating: 4.9,
      description: "Exquisite French cuisine in an intimate setting with impeccable service."
    },
    {
      image: restaurant2,
      title: "Sky Lounge",
      cuisine: "Contemporary Fusion",
      rating: 4.8,
      description: "Panoramic city views paired with innovative culinary creations."
    },
    {
      image: restaurant3,
      title: "Azure Coast",
      cuisine: "Mediterranean Seafood",
      rating: 4.9,
      description: "Fresh ocean catches and coastal flavors in a stunning beachfront location."
    }
  ];

  const featuredFlights = [
    {
      image: flight1,
      title: "First Class Experience",
      route: "International Routes",
      description: "Travel in ultimate luxury with our premium first-class service."
    },
    {
      image: flight2,
      title: "Scenic Journeys",
      route: "European Destinations",
      description: "Enjoy breathtaking views and comfort on your next European adventure."
    },
    {
      image: flight3,
      title: "Business Elite",
      route: "Global Network",
      description: "Work or relax in style with lie-flat seats and premium amenities."
    }
  ];

  const handleSearch = async (query?: string) => {
    const queryToSend = query || searchQuery;
    if (!queryToSend.trim()) return;
    
    // If we have pending flight dates, include them in the query
    let finalQuery = queryToSend;
    if (pendingFlightDates) {
      if (pendingFlightDates.returnDate) {
        finalQuery = `Find flights to ${queryToSend} departing ${pendingFlightDates.departureDate} returning ${pendingFlightDates.returnDate}`;
      } else {
        finalQuery = `Find one-way flights to ${queryToSend} on ${pendingFlightDates.departureDate}`;
      }
      setPendingFlightDates(null);
    }
    
    setIsLoading(true);
    setSearchResults([]);
    setMessages(prev => [...prev, { role: 'user', content: queryToSend }]);
    setSearchQuery("");

    try {
      const { data, error } = await supabase.functions.invoke('travel-ai-agent', {
        body: { 
          message: finalQuery,
          conversationHistory,
          userLocation: userLocation ? {
            latitude: userLocation.lat,
            longitude: userLocation.lng
          } : undefined
        }
      });

      if (error) throw error;

      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      
      if (data.toolResults && data.toolResults.length > 0) {
        setSearchResults(data.toolResults.filter((r: any) => r.results && r.results.length > 0));
      }

      if (data.conversationHistory) {
        setConversationHistory(data.conversationHistory);
      }
    } catch (err: any) {
      console.error('AI Agent error:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to process your request",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDatePickerRequest = (type: "hotel" | "flight", context: string) => {
    console.log('Quick action date picker requested:', { type, context });
    toast({
      title: type === "hotel" ? "Select your stay dates" : "Select your flight dates",
      description: "Pick dates to continue.",
    });
    setShowDatePicker({ type, context });
  };

  const handleDatesSelected = async (dates: { checkIn?: string; checkOut?: string; departureDate?: string; returnDate?: string }) => {
    if (!showDatePicker) return;

    const { type, context } = showDatePicker;
    setShowDatePicker(null);

    if (type === "hotel" && dates.checkIn && dates.checkOut) {
      const query = `${context} from ${dates.checkIn} to ${dates.checkOut}`;
      handleSearch(query);
    } else if (type === "flight" && dates.departureDate) {
      // Store flight dates and prompt for destination
      setPendingFlightDates({
        departureDate: dates.departureDate,
        returnDate: dates.returnDate
      });
      
      const promptMessage = dates.returnDate 
        ? `Great! You're looking for a round-trip flight departing on ${dates.departureDate} and returning on ${dates.returnDate}. Where would you like to fly to?`
        : `Great! You're looking for a one-way flight on ${dates.departureDate}. Where would you like to fly to?`;
      
      setMessages([{ role: 'assistant', content: promptMessage }]);
      setConversationHistory([{ role: 'assistant', content: promptMessage }]);
    }
  };

  const handleQuickAction = async (action: string) => {
    const queries = {
      hotels: userLocation 
        ? `Show me popular hotels near my current location`
        : "Show me popular hotels near me",
      flights: userLocation
        ? `I need to find flights from my current location`
        : "I need to find flights",
      destinations: "What are some popular travel destinations?",
      restaurants: userLocation
        ? `Show me popular restaurants near my current location`
        : "Show me popular restaurants near me"
    };
    const query = queries[action as keyof typeof queries];
    console.log('Quick action selected:', action, '->', query);
    toast({ title: "Searching", description: query });
    await handleSearch(query);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSearch();
    }
  };

  const resetChat = () => {
    setMessages([]);
    setSearchResults([]);
    setConversationHistory([]);
    setPendingFlightDates(null);
  };

  const showChat = messages.length > 0;

  return (
    <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
      <div className="w-full h-full flex flex-col">
        {!showChat ? (
          // Initial search view - centered
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
            <div className="w-full max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Logo and Title */}
              <div className="flex flex-col items-center space-y-4 mb-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                  <img src={logomark} alt="Goldsainte" className="h-20 w-20 relative z-10" />
                </div>
                <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  Goldsainte: Your AI Travel Concierge
                </h1>
                <p className="text-muted-foreground text-center max-w-md">
                  Your intelligent travel companion powered by AI. Find hotels, destinations, and plan your perfect trip.
                </p>
                {userLocation && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPinned className="h-3 w-3 text-primary" />
                    <span>Location detected - showing nearby results</span>
                  </div>
                )}
              </div>

              {/* Main Search */}
              <Card className="relative overflow-hidden border-2 shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5" />
                <div className="relative p-2">
                  <div className="relative">
                    <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                    <Input
                      placeholder="Where would you like to go? Ask me anything..."
                      className="w-full h-14 pl-12 pr-14 text-base border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={isLoading}
                    />
                    <Button
                      onClick={() => handleSearch()}
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-xl"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Search className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Quick Actions */}
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center font-medium tracking-wide uppercase">Start Your Journey</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <Card
                    className="group relative overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border border-primary/10 bg-gradient-to-br from-background via-primary/5 to-accent/10"
                    onClick={() => handleDatePickerRequest("hotel", "Show me hotels near me")}
                    role="button"
                    tabIndex={0}
                    aria-label="Search Hotels"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleDatePickerRequest("hotel", "Show me hotels near me"); }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20 opacity-0 group-hover:opacity-100 transition-all duration-500" />
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-primary opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />
                    <div className="relative p-8 flex flex-col items-center gap-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full group-hover:bg-primary/50 transition-all duration-500" />
                        <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/30 via-primary/20 to-transparent flex items-center justify-center backdrop-blur-sm border border-primary/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                          <Hotel className="h-8 w-8 text-primary drop-shadow-lg" />
                        </div>
                      </div>
                      <div className="space-y-1 text-center">
                        <span className="text-lg font-bold text-foreground tracking-tight">Hotels</span>
                        <p className="text-xs text-muted-foreground">Luxury stays</p>
                      </div>
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent transition-all duration-500 group-hover:w-full" />
                    </div>
                  </Card>

                  <Card
                    className="group relative overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border border-accent/10 bg-gradient-to-br from-background via-accent/5 to-primary/10"
                    onClick={() => handleDatePickerRequest("flight", "Show me flights from my location")}
                    role="button"
                    tabIndex={0}
                    aria-label="Search Flights"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleDatePickerRequest("flight", "Show me flights from my location"); }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-transparent to-primary/20 opacity-0 group-hover:opacity-100 transition-all duration-500" />
                    <div className="absolute -inset-1 bg-gradient-to-r from-accent via-primary to-accent opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />
                    <div className="relative p-8 flex flex-col items-center gap-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-accent/30 blur-2xl rounded-full group-hover:bg-accent/50 transition-all duration-500" />
                        <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-accent/30 via-accent/20 to-transparent flex items-center justify-center backdrop-blur-sm border border-accent/20 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
                          <Plane className="h-8 w-8 text-accent drop-shadow-lg" />
                        </div>
                      </div>
                      <div className="space-y-1 text-center">
                        <span className="text-lg font-bold text-foreground tracking-tight">Flights</span>
                        <p className="text-xs text-muted-foreground">Premium travel</p>
                      </div>
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent transition-all duration-500 group-hover:w-full" />
                    </div>
                  </Card>

                  <Card
                    className="group relative overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border border-primary/10 bg-gradient-to-br from-background via-primary/5 to-accent/10"
                    onClick={() => handleQuickAction('destinations')}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20 opacity-0 group-hover:opacity-100 transition-all duration-500" />
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-primary opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />
                    <div className="relative p-8 flex flex-col items-center gap-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full group-hover:bg-primary/50 transition-all duration-500" />
                        <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/30 via-primary/20 to-transparent flex items-center justify-center backdrop-blur-sm border border-primary/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                          <MapPin className="h-8 w-8 text-primary drop-shadow-lg" />
                        </div>
                      </div>
                      <div className="space-y-1 text-center">
                        <span className="text-lg font-bold text-foreground tracking-tight">Destinations</span>
                        <p className="text-xs text-muted-foreground">Dream places</p>
                      </div>
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent transition-all duration-500 group-hover:w-full" />
                    </div>
                  </Card>

                  <Card
                    className="group relative overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border border-accent/10 bg-gradient-to-br from-background via-accent/5 to-primary/10"
                    onClick={() => handleQuickAction('restaurants')}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-transparent to-primary/20 opacity-0 group-hover:opacity-100 transition-all duration-500" />
                    <div className="absolute -inset-1 bg-gradient-to-r from-accent via-primary to-accent opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />
                    <div className="relative p-8 flex flex-col items-center gap-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-accent/30 blur-2xl rounded-full group-hover:bg-accent/50 transition-all duration-500" />
                        <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-accent/30 via-accent/20 to-transparent flex items-center justify-center backdrop-blur-sm border border-accent/20 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
                          <UtensilsCrossed className="h-8 w-8 text-accent drop-shadow-lg" />
                        </div>
                      </div>
                      <div className="space-y-1 text-center">
                        <span className="text-lg font-bold text-foreground tracking-tight">Restaurants</span>
                        <p className="text-xs text-muted-foreground">Fine dining</p>
                      </div>
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent transition-all duration-500 group-hover:w-full" />
                    </div>
                  </Card>
                </div>
              </div>

              {/* Get Inspired Section */}
              <div className="space-y-6 pt-12">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                    Get Inspired
                  </h2>
                  <p className="text-muted-foreground">
                    Discover your next dream destination
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {inspirationDestinations.map((destination, idx) => (
                    <InspirationCard
                      key={idx}
                      image={destination.image}
                      title={destination.title}
                      location={destination.location}
                      description={destination.description}
                    />
                  ))}
                </div>
              </div>

              {/* Featured Restaurants */}
              <div className="space-y-6 pt-12">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-accent via-primary to-accent bg-clip-text text-transparent">
                    Fine Dining Experiences
                  </h2>
                  <p className="text-muted-foreground">
                    Savor exceptional cuisine at world-renowned restaurants
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {featuredRestaurants.map((restaurant, idx) => (
                    <Card
                      key={idx}
                      className="group relative overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border border-accent/20"
                      onClick={() => handleQuickAction('restaurants')}
                    >
                      <div className="relative h-64 overflow-hidden">
                        <img
                          src={restaurant.image}
                          alt={restaurant.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                        <Badge className="absolute top-4 right-4 bg-accent/90 backdrop-blur-sm border-accent/50 gap-1">
                          <Star className="h-3 w-3 fill-current" />
                          {restaurant.rating}
                        </Badge>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                        <h3 className="text-2xl font-bold mb-1">{restaurant.title}</h3>
                        <p className="text-sm text-accent mb-2">{restaurant.cuisine}</p>
                        <p className="text-sm text-white/80 line-clamp-2">{restaurant.description}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Featured Flights */}
              <div className="space-y-6 pt-12">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                    Premium Flight Services
                  </h2>
                  <p className="text-muted-foreground">
                    Fly in comfort and style to destinations worldwide
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {featuredFlights.map((flight, idx) => (
                    <Card
                      key={idx}
                      className="group relative overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border border-primary/20"
                      onClick={() => handleDatePickerRequest("flight", "Show me flights from my location")}
                    >
                      <div className="relative h-64 overflow-hidden">
                        <img
                          src={flight.image}
                          alt={flight.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                        <div className="absolute top-4 right-4">
                          <Plane className="h-6 w-6 text-white drop-shadow-lg" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                        <h3 className="text-2xl font-bold mb-1">{flight.title}</h3>
                        <p className="text-sm text-primary mb-2">{flight.route}</p>
                        <p className="text-sm text-white/80 line-clamp-2">{flight.description}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Date Picker - Initial View */}
              {showDatePicker && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
                  <ChatDatePicker
                    type={showDatePicker.type}
                    onDatesSelected={handleDatesSelected}
                    onCancel={() => setShowDatePicker(null)}
                  />
                </div>
              )}

              {/* Footer */}
              <p className="text-xs text-muted-foreground text-center pt-8">
                By using Goldsainte AI, you agree to our{" "}
                <a href="#" className="underline hover:text-foreground">Terms</a>
                {" "}and{" "}
                <a href="#" className="underline hover:text-foreground">Privacy Policy</a>
              </p>
            </div>
          </div>
        ) : (
          // Chat view - full screen
          <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={resetChat}
                    className="rounded-full"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <img src={logomark} alt="Goldsainte" className="h-8 w-8" />
                  <div>
                    <h1 className="text-lg font-semibold text-foreground">Goldsainte AI</h1>
                    <p className="text-xs text-muted-foreground">Your travel assistant</p>
                  </div>
                </div>
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI Powered
                </Badge>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-6">
              <div className="py-6 space-y-6 max-w-4xl mx-auto">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}>
                    {msg.role === 'assistant' && (
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Sparkles className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                    )}
                    <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                      <Card className={`p-4 ${
                        msg.role === 'user' 
                          ? 'bg-primary text-primary-foreground border-primary' 
                          : 'bg-card border-border'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      </Card>
                    </div>
                  </div>
                ))}

                {/* Date Picker */}
                {showDatePicker && (
                  <div className="animate-in fade-in slide-in-from-bottom-4">
                    <ChatDatePicker
                      type={showDatePicker.type}
                      onDatesSelected={handleDatesSelected}
                      onCancel={() => setShowDatePicker(null)}
                    />
                  </div>
                )}

                {/* Search Results */}
                {searchResults.map((result, idx) => (
                  <div key={`result-${idx}`} className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                    {result.type === 'hotels' && result.results.length > 0 && (
                      <div className="space-y-4">
                        <HotelFilters
                          resultsCount={result.results.length}
                          currentSort={result.filters?.sortBy}
                          currentMinRating={result.filters?.minRating}
                          onSortChange={(sortBy) => {
                            handleSearch(`Show me hotels sorted by ${sortBy === 'price' ? 'lowest price' : sortBy === 'review_score' ? 'highest rating' : 'popularity'} in ${result.location?.name}`);
                          }}
                          onMinRatingChange={(rating) => {
                            const baseQuery = `Show me hotels in ${result.location?.name}`;
                            const sortQuery = result.filters?.sortBy ? ` sorted by ${result.filters.sortBy}` : '';
                            const ratingQuery = rating ? ` with minimum rating ${rating}` : '';
                            handleSearch(baseQuery + sortQuery + ratingQuery);
                          }}
                        />
                        <div className="space-y-4">
                          {result.results.map((hotel: any, hotelIdx: number) => (
                            <SimplePropertyCard
                              key={hotel.hotel_id || hotelIdx}
                              property={hotel}
                              type="hotels"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {result.type === 'destinations' && result.results.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-foreground">
                          🌍 Destinations
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {result.results.slice(0, 6).map((dest: any, destIdx: number) => (
                            <Card key={dest.dest_id || destIdx} className="p-4 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary">
                              <h4 className="font-semibold text-foreground mb-1">{dest.label}</h4>
                              <p className="text-sm text-muted-foreground">{dest.region || dest.dest_type}</p>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.type === 'restaurants' && result.results.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-foreground">
                          🍽️ Restaurants Nearby
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {result.results.map((restaurant: any, restIdx: number) => (
                            <RestaurantCard
                              key={restaurant.id || restIdx}
                              id={restaurant.id}
                              name={restaurant.name}
                              rating={restaurant.rating}
                              userRatingsTotal={restaurant.userRatingsTotal}
                              priceLevel={restaurant.priceLevel}
                              address={restaurant.address}
                              photoUrl={restaurant.photoUrl}
                              openNow={restaurant.openNow}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {result.type === 'flights' && result.results.length > 0 && (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-4">
                            ✈️ Flights from {result.origin?.name} to {result.destination?.name}
                          </h3>
                          <FlightFilters
                            resultsCount={result.results.length}
                            currentSort={result.filters?.sortBy || 'best'}
                            onSortChange={(sortBy) => {
                              const origin = result.origin?.name;
                              const destination = result.destination?.name;
                              const departureDate = result.departureDate;
                              const returnDate = result.returnDate;
                              
                              const sortLabels = {
                                'best': 'best available',
                                'price': 'lowest price',
                                'duration': 'shortest duration',
                                'departure_early': 'earliest departure',
                                'departure_late': 'latest departure'
                              };
                              
                              let query = `Show me flights from ${origin} to ${destination}`;
                              if (departureDate) {
                                query += ` departing ${departureDate}`;
                              }
                              if (returnDate) {
                                query += ` returning ${returnDate}`;
                              }
                              query += ` sorted by ${sortLabels[sortBy as keyof typeof sortLabels]}`;
                              
                              handleSearch(query);
                            }}
                            onClearFilters={() => {
                              const origin = result.origin?.name;
                              const destination = result.destination?.name;
                              const departureDate = result.departureDate;
                              const returnDate = result.returnDate;
                              
                              let query = `Show me flights from ${origin} to ${destination}`;
                              if (departureDate) {
                                query += ` departing ${departureDate}`;
                              }
                              if (returnDate) {
                                query += ` returning ${returnDate}`;
                              }
                              
                              handleSearch(query);
                            }}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {result.results.map((flight: any, flightIdx: number) => (
                            <FlightCard
                              key={flight.id || flightIdx}
                              flight={flight}
                              dictionaries={result.dictionaries}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex gap-3 animate-in fade-in">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                    <Card className="p-4 bg-card">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">Searching for the best options...</span>
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
              <div className="px-6 py-4 max-w-4xl mx-auto">
                <Card className="border-2 shadow-lg">
                  <div className="p-2">
                    <div className="relative">
                      <Input
                        placeholder="Ask me anything about travel..."
                        className="w-full h-12 px-4 pr-14 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isLoading}
                      />
                      <Button
                        onClick={() => handleSearch()}
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg"
                        disabled={isLoading || !searchQuery.trim()}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default Index;
