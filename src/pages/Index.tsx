import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plane, Hotel, MapPin, UtensilsCrossed, Search, Send, Loader2, Sparkles, ArrowLeft, MapPinned, Star, FileCheck, Ticket, Car, Briefcase, Bike } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SimplePropertyCard } from "@/components/SimplePropertyCard";
import { InspirationCard } from "@/components/InspirationCard";
import { RestaurantCard } from "@/components/RestaurantCard";
import { FlightCard } from "@/components/FlightCard";
import { EventCard } from "@/components/EventCard";
import { PackageCard } from "@/components/PackageCard";
import { ChatDatePicker } from "@/components/ChatDatePicker";
import { PriceSlider } from "@/components/PriceSlider";
import { CuisineSelector } from "@/components/CuisineSelector";
import { TripTypeSelector } from "@/components/TripTypeSelector";
import { HotelFilters } from "@/components/HotelFilters";
import { FlightFilters } from "@/components/FlightFilters";
import { VisaServiceModal } from "@/components/VisaServiceModal";
import { WelcomeModal } from "@/components/WelcomeModal";
import { CarCard } from "@/components/CarCard";
import logomark from "@/assets/logomark-seal-gold.png";
import santoriniGreece from "@/assets/santorini-greece.jpg";
import swissAlps from "@/assets/swiss-alps.jpg";
import maldivesTropical from "@/assets/maldives-tropical.jpg";
import parisUrban from "@/assets/paris-urban.jpg";
import dubaiDesert from "@/assets/dubai-desert.jpg";
import amalfiCoast from "@/assets/amalfi-coast.jpg";
import icelandNorthernLights from "@/assets/iceland-northern-lights.jpg";
import baliSerenity from "@/assets/bali-serenity.jpg";
import restaurant1 from "@/assets/restaurant1.jpg";
import restaurant2 from "@/assets/restaurant2.jpg";
import restaurant3 from "@/assets/restaurant3.jpg";
import flight1 from "@/assets/flight1.jpg";
import flight2 from "@/assets/flight2.jpg";
import flight3 from "@/assets/flight3.jpg";
import luxuryHotels from "@/assets/luxury-hotels.jpg";
import luxuryFlights from "@/assets/luxury-flights.jpg";
import luxuryDestinations from "@/assets/luxury-destinations.jpg";
import luxuryRestaurants from "@/assets/luxury-restaurants.jpg";
import luxuryVisa from "@/assets/luxury-visa.jpg";
import luxuryEvents from "@/assets/luxury-events.jpg";
import destination7 from "@/assets/destination7.jpg";
import destination8 from "@/assets/destination8.jpg";
import cyclingTour from "@/assets/cycling-tour.jpg";
import spaWellness from "@/assets/spa-wellness.jpg";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface SearchResult {
  type: string;
  results?: any[];
  location?: any;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  filters?: any;
  origin?: { code: string; name: string } | string;
  destination?: { code: string; name: string } | string;
  dictionaries?: any;
  city?: string;
  departureDate?: string;
  returnDate?: string;
  meta?: any;
  // Package-specific fields
  flights?: any[];
  hotels?: any[];
  cars?: any[];
  travelers?: number;
  estimatedTotal?: number;
  savings?: number;
}

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<{ type: "hotel" | "flight"; context: string } | null>(null);
  const [pendingFlightDates, setPendingFlightDates] = useState<{ departureDate: string; returnDate?: string } | null>(null);
  const [visaModalData, setVisaModalData] = useState<{ 
    open: boolean; 
    fromCountry: string; 
    toCountry: string; 
    visaInformation: any 
  }>({ 
    open: false, 
    fromCountry: "", 
    toCountry: "", 
    visaInformation: null 
  });
  const [showPriceSlider, setShowPriceSlider] = useState<{ type: "hotel" | "flight" | "restaurant" | "car" } | null>(null);
  const [showCuisineSelector, setShowCuisineSelector] = useState(false);
  const [showTripTypeSelector, setShowTripTypeSelector] = useState(false);
  const [selectedTripType, setSelectedTripType] = useState<"one-way" | "round-trip" | null>(null);
  const selectedTripTypeRef = useRef<"one-way" | "round-trip" | null>(null);
  const tripTypeResolvedRef = useRef<boolean>(false);
  const lastRequestIdRef = useRef<number>(0);
  const [activeQuickLink, setActiveQuickLink] = useState<"hotels" | "flights" | "restaurants" | "events" | "cars" | null>(null);
  const [usePreferences, setUsePreferences] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  const rotatingMessages = [
    "Where to next? Discover handpicked hotels tailored to your taste.",
    "Book smarter flights with AI that knows your preferences.",
    "Find restaurants worth the reservation — curated by locals and AI.",
    "Unlock exclusive events and local experiences wherever you land.",
    "Join a planned excursion — guided by experts, powered by Goldsainte.",
    "Need more than a booking? Match with expert travel agents in minutes."
  ];

  // Handle service query parameter from Header
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const service = params.get('service');
    
    if (service && ['hotels', 'flights', 'restaurants', 'events', 'cars'].includes(service)) {
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Trigger the quick action after a short delay
      setTimeout(() => {
        handleQuickAction(service);
      }, 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Rotating messages effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % rotatingMessages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

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

  // Fetch user's preference setting
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('user_booking_preferences')
        .select('use_preferences_in_search')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        setUsePreferences(data.use_preferences_in_search ?? true);
      }
    };
    
    fetchPreferences();
  }, [user]);

  const togglePreferences = async (checked: boolean) => {
    setUsePreferences(checked);
    
    if (!user) return;
    
    const { error } = await supabase
      .from('user_booking_preferences')
      .upsert({
        user_id: user.id,
        use_preferences_in_search: checked
      }, {
        onConflict: 'user_id'
      });
    
    if (error) {
      console.error('Error updating preference:', error);
      toast({
        title: "Error",
        description: "Failed to save preference",
        variant: "destructive",
      });
    } else {
      toast({
        title: checked ? "Preferences enabled" : "Preferences disabled",
        description: checked 
          ? "Search results will match your saved preferences" 
          : "Search results will show all available options",
      });
    }
  };

  const inspirationDestinations = [
    {
      image: santoriniGreece,
      title: "Santorini Paradise",
      location: "Greece",
      description: "Experience breathtaking sunsets and pristine white architecture overlooking the Aegean Sea."
    },
    {
      image: swissAlps,
      title: "Alpine Luxury",
      location: "Swiss Alps",
      description: "Discover world-class skiing and cozy mountain retreats in the heart of the Alps."
    },
    {
      image: maldivesTropical,
      title: "Tropical Escape",
      location: "Maldives",
      description: "Unwind in overwater bungalows surrounded by crystal-clear turquoise waters."
    },
    {
      image: parisUrban,
      title: "Urban Elegance",
      location: "Paris, France",
      description: "Immerse yourself in art, culture, and world-renowned cuisine in the City of Light."
    },
    {
      image: dubaiDesert,
      title: "Desert Oasis",
      location: "Dubai, UAE",
      description: "Experience luxury redefined with stunning architecture and endless entertainment."
    },
    {
      image: amalfiCoast,
      title: "Coastal Charm",
      location: "Amalfi Coast, Italy",
      description: "Explore picturesque villages, stunning cliffs, and authentic Italian hospitality."
    },
    {
      image: icelandNorthernLights,
      title: "Northern Lights",
      location: "Iceland",
      description: "Witness the magical aurora borealis in a winter wonderland of natural beauty."
    },
    {
      image: baliSerenity,
      title: "Bali Serenity",
      location: "Bali, Indonesia",
      description: "Find peace in lush rice terraces and traditional temples with world-class hospitality."
    }
  ];

  const featuredRestaurants = [
    {
      id: "le-bernardin",
      image: restaurant1,
      title: "Le Bernardin",
      cuisine: "French Seafood",
      address: "155 W 51st St, New York, NY 10019",
      rating: 4.8,
      description: "Three Michelin-starred seafood restaurant offering refined French cuisine."
    },
    {
      id: "eleven-madison-park",
      image: restaurant2,
      title: "Eleven Madison Park",
      cuisine: "Contemporary American",
      address: "11 Madison Ave, New York, NY 10010",
      rating: 4.7,
      description: "Iconic three-Michelin-starred restaurant featuring seasonal plant-based tasting menu."
    },
    {
      id: "per-se",
      image: restaurant3,
      title: "Per Se",
      cuisine: "French Contemporary",
      address: "10 Columbus Circle, New York, NY 10019",
      rating: 4.6,
      description: "Thomas Keller's three-Michelin-starred restaurant with stunning Central Park views."
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
    const requestId = ++lastRequestIdRef.current;

    // Close Trip Type modal if the user typed the answer directly
    const normalizedTrip = queryToSend.trim().toLowerCase();
    if (normalizedTrip === 'one-way' || normalizedTrip === 'one way') {
      setSelectedTripType('one-way');
      selectedTripTypeRef.current = 'one-way';
      tripTypeResolvedRef.current = true;
      setShowTripTypeSelector(false);
    } else if (normalizedTrip === 'round-trip' || normalizedTrip === 'round trip' || normalizedTrip === 'roundtrip') {
      setSelectedTripType('round-trip');
      selectedTripTypeRef.current = 'round-trip';
      tripTypeResolvedRef.current = true;
      setShowTripTypeSelector(false);
    }
    
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
          isQuickLink: !!activeQuickLink,
          quickLinkType: activeQuickLink || undefined,
          usePreferences,
          userLocation: userLocation ? {
            latitude: userLocation.lat,
            longitude: userLocation.lng
          } : undefined
        }
      });

      if (error) throw error;

      // Ignore stale responses
      if (requestId !== lastRequestIdRef.current) return;

      setMessages(prev => [...prev, { role: 'assistant', content: data.message, ...(data.quickLinkState && { quickLinkState: data.quickLinkState }) }]);
      
      if (data.toolResults && data.toolResults.length > 0) {
        setSearchResults(data.toolResults.filter((r: any) => r.results && r.results.length > 0));
        setActiveQuickLink(null);
        
        // Check for visa results
        const visaResult = data.toolResults.find((r: any) => r.type === 'visa');
        if (visaResult && visaResult.fromCountry && visaResult.toCountry) {
          // Store visa data for potential service request
          const isVisaRequired = visaResult.information && 
            (visaResult.information.toLowerCase().includes('visa required') || 
             visaResult.information.toLowerCase().includes('visa is required') ||
             visaResult.information.toLowerCase().includes('must obtain'));
          
          // Check if AI suggests visa assistance or user asks for help
          const userWantsHelp = queryToSend.toLowerCase().includes('help') || 
                               queryToSend.toLowerCase().includes('assist') ||
                               queryToSend.toLowerCase().includes('yes') ||
                               data.message.toLowerCase().includes('assist you with your visa');
          
          if (isVisaRequired && userWantsHelp) {
            // Show the visa service modal
            setTimeout(() => {
              setVisaModalData({
                open: true,
                fromCountry: visaResult.fromCountry,
                toCountry: visaResult.toCountry,
                visaInformation: visaResult
              });
            }, 1000); // Small delay so user can read the AI message first
          }
        }
      }

      if (data.conversationHistory) {
        setConversationHistory(data.conversationHistory);
      }

      // Check if AI is asking about dates and show date picker
      const aiMessage = data.message.toLowerCase();
      const dateKeywords = [
        'when are you', 'when will you', 'which dates', 'what dates',
        'check-in', 'check in', 'check out', 'checkout',
        'when would you like to check', 'when would you like to stay',
        'when would you like to depart', 'when would you like to fly',
        'travel dates', 'departure date', 'return date',
        'when do you want to', 'what day', 'when should',
        'when do you need', 'arrival date', 'leaving on',
        'pick up the car', 'pickup date', 'when would you like to pick up',
        'return the car', 'drop off', 'when would you like to return'
      ];
      
      const hasDateKeyword = dateKeywords.some(keyword => aiMessage.includes(keyword));
      
      if (hasDateKeyword) {
        // Determine the type based on context
        let type: 'hotel' | 'flight' = 'flight';
        if (aiMessage.includes('stay') || 
            aiMessage.includes('hotel') || 
            aiMessage.includes('check')) {
          type = 'hotel';
        } else if (aiMessage.includes('pick up') || 
                   aiMessage.includes('pickup') || 
                   aiMessage.includes('car') ||
                   aiMessage.includes('rental')) {
          type = 'flight'; // Use flight type for car rentals (handles single dates)
        }
        setTimeout(() => setShowDatePicker({ type, context: 'quicklink' }), 500);
      }

      // Check if AI is asking about budget and show price slider
      const budgetKeywords = {
        hotel: ['budget per night', 'price range per night', 'spend per night', 'nightly budget', 'per night'],
        flight: ['budget per passenger', 'budget for the flight', 'price per person', 'flight budget', 'per passenger', 'spend on flights'],
        restaurant: ['budget per person', 'dining budget', 'spend on food', 'price range for dining', 'meal budget', 'per person for dining'],
        car: ['budget per day', 'daily budget', 'car rental budget', 'spend per day', 'per day']
      };
      
      let budgetType: "hotel" | "flight" | "restaurant" | "car" | null = null;
      
      for (const [type, keywords] of Object.entries(budgetKeywords)) {
        if (keywords.some(keyword => aiMessage.includes(keyword))) {
          budgetType = type as "hotel" | "flight" | "restaurant" | "car";
          break;
        }
      }
      
      if (budgetType) {
        setTimeout(() => setShowPriceSlider({ type: budgetType }), 500);
      }
      
      // Check if AI is asking about cuisine preference
      if (aiMessage.includes('what type of cuisine') || 
          aiMessage.includes('what cuisine are you') ||
          aiMessage.includes('cuisine preference')) {
        setTimeout(() => setShowCuisineSelector(true), 500);
      }
      
      // Check if AI is asking about trip type - only for cars after location is provided
      if (aiMessage.includes('one-way flight or a round-trip') ||
          aiMessage.includes('one-way or round-trip') ||
          aiMessage.includes('would you like a one-way') ||
          aiMessage.includes('one-way rental or round-trip') ||
          aiMessage.includes('is this a one-way rental')) {
        // Only show selector if we have location data (step > 1) or it's a flight
        const isCarWithLocation = activeQuickLink === 'cars' && data.quickLinkState?.step >= 2;
        const isFlightQuestion = aiMessage.includes('flight');
        
        if (!tripTypeResolvedRef.current && !showTripTypeSelector && (isCarWithLocation || isFlightQuestion)) {
          setTimeout(() => setShowTripTypeSelector(true), 500);
        }
      }
    } catch (err: any) {
      console.error('AI Agent error:', err);
      console.error('Error details:', JSON.stringify(err, null, 2));
      toast({
        title: "Error",
        description: err.message || err.error?.message || "Failed to process your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      if (requestId === lastRequestIdRef.current) setIsLoading(false);
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
      const query = `${dates.checkIn} to ${dates.checkOut}`;
      handleSearch(query);
    } else if (type === "flight" && dates.departureDate) {
      // Send the date selection as a message to continue the conversation
      const dateMessage = dates.returnDate 
        ? `${dates.departureDate} returning ${dates.returnDate}`
        : dates.departureDate;
      handleSearch(dateMessage);
    }
  };

  const handleQuickAction = async (action: string) => {
    const queries = {
      hotels: "I'm looking for hotels",
      flights: "I need to find flights",
      destinations: "What are some popular travel destinations?",
      restaurants: "I'm looking for restaurants",
      visa: "What are visa requirements for traveling abroad?",
      events: "I'm looking for events",
      cars: "I need a car rental"
    };
    const query = queries[action as keyof typeof queries];
    console.log('Quick action selected:', action, '->', query);
    
    setIsLoading(true);
    setSearchResults([]);
    setMessages([{ role: 'user', content: query }]);

    const requestId = ++lastRequestIdRef.current;

    try {
      setActiveQuickLink(action as "hotels" | "flights" | "restaurants" | "events" | "cars");
      const { data, error } = await supabase.functions.invoke('travel-ai-agent', {
        body: { 
          message: query,
          conversationHistory: [],
          isQuickLink: true, // Flag to indicate this is from a quick link
          quickLinkType: action,
          usePreferences,
          userLocation: userLocation ? {
            latitude: userLocation.lat,
            longitude: userLocation.lng
          } : undefined
        }
      });

      if (error) throw error;

      // Ignore stale responses
      if (requestId !== lastRequestIdRef.current) return;

      setMessages([
        { role: 'user', content: query },
        { role: 'assistant', content: data.message, ...(data.quickLinkState && { quickLinkState: data.quickLinkState }) }
      ]);
      
      if (data.toolResults && data.toolResults.length > 0) {
        setSearchResults(data.toolResults.filter((r: any) => r.results && r.results.length > 0));
        setActiveQuickLink(null);
      }
      
      if (data.conversationHistory) {
        setConversationHistory(data.conversationHistory);
      }

      // Mirror modal triggers used in handleSearch
      const aiMessage = data.message.toLowerCase();
      const dateKeywords = [
        'when are you', 'when will you', 'which dates', 'what dates',
        'check-in', 'check in', 'check out', 'checkout',
        'when would you like to check', 'when would you like to stay',
        'when would you like to depart', 'when would you like to fly',
        'travel dates', 'departure date', 'return date',
        'when do you want to', 'what day', 'when should',
        'when do you need', 'arrival date', 'leaving on',
        'pick up the car', 'pickup date', 'when would you like to pick up',
        'return the car', 'drop off', 'when would you like to return'
      ];
      const hasDateKeyword = dateKeywords.some((k) => aiMessage.includes(k));
      if (hasDateKeyword) {
        let type: 'hotel' | 'flight' = 'flight';
        if (aiMessage.includes('stay') || aiMessage.includes('hotel') || aiMessage.includes('check')) type = 'hotel';
        else if (aiMessage.includes('pick up') || aiMessage.includes('pickup') || aiMessage.includes('car') || aiMessage.includes('rental')) type = 'flight';
        setTimeout(() => setShowDatePicker((prev) => prev ?? { type, context: 'quicklink' }), 500);
      }

      const budgetKeywords = {
        hotel: ['budget per night', 'price range per night', 'spend per night', 'nightly budget', 'per night'],
        flight: ['budget per passenger', 'budget for the flight', 'price per person', 'flight budget', 'per passenger', 'spend on flights'],
        restaurant: ['budget per person', 'dining budget', 'spend on food', 'price range for dining', 'meal budget', 'per person for dining'],
        car: ['budget per day', 'daily budget', 'car rental budget', 'spend per day', 'per day']
      } as const;
      let budgetType: "hotel" | "flight" | "restaurant" | "car" | null = null;
      for (const [type, keywords] of Object.entries(budgetKeywords)) {
        if (keywords.some((k) => aiMessage.includes(k))) { budgetType = type as any; break; }
      }
      if (budgetType) setTimeout(() => setShowPriceSlider({ type: budgetType! }), 500);

      if (
        aiMessage.includes('one-way flight or a round-trip') ||
        aiMessage.includes('one-way or round-trip') ||
        aiMessage.includes('would you like a one-way') ||
        aiMessage.includes('one-way rental or round-trip') ||
        aiMessage.includes('is this a one-way rental')
      ) {
        if (!tripTypeResolvedRef.current && !showTripTypeSelector) {
          setTimeout(() => setShowTripTypeSelector(true), 500);
        }
      }
    } catch (err: any) {
      console.error('AI Agent error:', err);
      console.error('Error details:', JSON.stringify(err, null, 2));
      toast({
        title: "Error",
        description: err.message || err.error?.message || "Failed to process your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      if (requestId === lastRequestIdRef.current) setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSearch();
    }
  };

  const handleInspirationClick = async (destination: { title: string; location: string; description: string }) => {
    // Scroll to top (chat area)
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Wait for scroll to complete
    setTimeout(() => {
      // Pre-populate message asking about travel to this destination
      const message = `I'm interested in traveling to ${destination.location}. Can you help me find flights and hotels?`;
      handleSearch(message);
    }, 500);
  };

  const resetChat = () => {
    setMessages([]);
    setSearchResults([]);
    setConversationHistory([]);
    setPendingFlightDates(null);
    setShowDatePicker(null);
    setShowPriceSlider(null);
    setShowCuisineSelector(false);
    setShowTripTypeSelector(false);
    setSelectedTripType(null);
    selectedTripTypeRef.current = null;
  };

  const handlePriceSelected = (price: number) => {
    setShowPriceSlider(null);
    handleSearch(`$${price}`);
  };

  const handleCuisineSelected = (cuisine: string) => {
    setShowCuisineSelector(false);
    handleSearch(cuisine);
  };

  const handleTripTypeSelected = (tripType: "one-way" | "round-trip") => {
    setSelectedTripType(tripType);
    selectedTripTypeRef.current = tripType;
    tripTypeResolvedRef.current = true;
    setShowTripTypeSelector(false);
    handleSearch(tripType);
  };

  const getPlaceholderText = () => {
    if (activeQuickLink === 'hotels') return 'Ask about hotels, accommodations, or places to stay...';
    if (activeQuickLink === 'flights') return 'Ask about flights, airfare, or travel...';
    if (activeQuickLink === 'restaurants') return 'Ask about restaurants, dining, or cuisine...';
    if (activeQuickLink === 'events') return 'Ask about events, concerts, or entertainment...';
    if (activeQuickLink === 'cars') return 'Ask about car rentals or transportation...';
    return 'Ask me anything about travel...';
  };

  const showChat = messages.length > 0;

  return (
    <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
      <div className="w-full h-full flex flex-col">
        {!showChat ? (
          // Initial search view - ChatGPT style centered
          <div className="flex-1 flex flex-col">
            {/* Centered Search Area */}
            <div className="min-h-[calc(100vh-4rem)] md:min-h-screen flex items-center justify-center px-4 py-6 md:py-8">
              <div className="w-full max-w-2xl space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Logo and Title */}
                <div className="flex flex-col items-center justify-center space-y-4 md:space-y-3">
                  <img src={logomark} alt="Goldsainte.Ai" className="h-20 w-20 md:h-16 md:w-16" />
                  <p className="text-sm md:text-base font-medium text-center text-muted-foreground max-w-xl px-2">
                    The first AI concierge powered by certified travel experts — one platform, endlessly personal.
                  </p>
                </div>

                {/* Main Search with rotating placeholder */}
                <div className="relative pt-2 md:pt-3 px-2 md:px-0">
                  <Input
                    placeholder={rotatingMessages[currentMessageIndex]}
                    className="w-full h-14 md:h-16 px-4 pr-14 text-base rounded-3xl border-[#BFAD72] shadow-sm focus-visible:ring-1 focus-visible:ring-[#BFAD72] placeholder:text-muted-foreground/60 placeholder:transition-opacity placeholder:duration-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                  />
                  <Button
                    onClick={() => handleSearch()}
                    size="icon"
                    variant="ghost"
                    className="absolute right-3 md:right-2 top-1/2 -translate-y-1/2 h-11 w-11 md:h-10 md:w-10 rounded-full hover:bg-muted"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>

                {/* What Goldsainte.AI can do button */}
                <div className="flex items-center justify-center px-2 md:px-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowWelcomeModal(true)}
                    className="rounded-full gap-2 h-10 md:h-9 px-4 text-[#0C4D47] hover:text-[#0C4D47] border-[#BFAD72]"
                  >
                    <Sparkles className="h-4 w-4" />
                    What Goldsainte.Ai can do
                  </Button>
                </div>

                {/* Footer */}
                <p className="text-xs text-muted-foreground text-center pt-4">
                  By using Goldsainte.Ai, you agree to our{" "}
                  <a href="#" className="underline hover:text-foreground">Terms</a>
                  {" "}and{" "}
                  <a href="#" className="underline hover:text-foreground">Privacy Policy</a>
                </p>
              </div>
            </div>

            {/* How Goldsainte.AI Works Section */}
            <div className="px-6 py-20 bg-gradient-to-b from-background via-accent/5 to-background">
              <div className="w-full max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                  {/* Left side - Text content only */}
                  <div className="space-y-6 lg:pr-8 pt-8">
                    <div className="space-y-4">
                      <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                        Start chatting with us.
                      </h2>
                      <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                        Ask us for suggestions for any destination or ask us for an entire itinerary. 
                        Be as specific as you can about the types of experiences that you like or take 
                        our quiz to determine your travel style.
                      </p>
                    </div>
                  </div>
                  
                  {/* Right side - Visual showcase AND search bar */}
                  <div className="space-y-8">
                    {/* Visual category showcase with images */}
                    <div className="relative h-[600px] lg:h-[650px]">
                    {/* Central profile circle */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                      <div className="h-28 w-28 sm:h-36 sm:w-36 md:h-48 md:w-48 rounded-full bg-gradient-to-br from-accent to-primary p-1 shadow-2xl">
                        <div className="h-full w-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                          <img src={logomark} alt="Goldsainte AI" className="h-14 w-14 sm:h-18 sm:w-18 md:h-24 md:w-24" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Category cards with images - positioned organically */}
                    {/* Top left - Spa/Wellness with image */}
                    <div className="absolute top-[40px] sm:top-[80px] md:top-[100px] left-[10px] sm:left-[30px] md:left-[40px] animate-float z-10">
                      <div className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl">
                        <img 
                          src={spaWellness} 
                          alt="Luxury spa massage treatment - Spa & Wellness" 
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 md:bottom-3 md:left-3 flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-full bg-white/95 backdrop-blur-sm shadow-md">
                          <Hotel className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-accent" />
                          <span className="text-[10px] sm:text-xs md:text-sm font-semibold">Spa</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Top right - Theater with image */}
                    <div className="absolute top-[40px] sm:top-[80px] md:top-[100px] right-[10px] sm:right-[30px] md:right-[40px] animate-float z-10" style={{ animationDelay: '0.5s' }}>
                      <div className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl">
                        <img 
                          src={luxuryEvents} 
                          alt="Theater" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 md:bottom-3 md:right-3 flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-full bg-white/95 backdrop-blur-sm shadow-md">
                          <Ticket className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-primary" />
                          <span className="text-[10px] sm:text-xs md:text-sm font-semibold">Theater</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Left - Luxury Resorts with image */}
                    <div className="absolute top-[130px] sm:top-[180px] md:top-[220px] left-[5px] sm:left-[20px] md:left-[30px] animate-float z-10" style={{ animationDelay: '1s' }}>
                      <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-48 md:h-48 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl">
                        <img 
                          src={maldivesTropical} 
                          alt="Luxury Resorts" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-1.5 left-1.5 sm:bottom-3 sm:left-3 md:bottom-4 md:left-4 flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-full bg-white/95 backdrop-blur-sm shadow-md">
                          <Hotel className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-primary" />
                          <span className="text-[10px] sm:text-xs md:text-sm font-semibold">Resorts</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Center top - Beach with image */}
                    <div className="absolute top-[5px] sm:top-[30px] md:top-[40px] left-1/2 -translate-x-1/2 animate-float z-10" style={{ animationDelay: '1.5s' }}>
                      <div className="relative w-24 h-24 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl">
                        <img 
                          src={amalfiCoast} 
                          alt="Beach Getaways" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 md:bottom-3 md:right-3 flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-full bg-white/95 backdrop-blur-sm shadow-md">
                          <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-accent" />
                          <span className="text-[10px] sm:text-xs md:text-sm font-semibold">Beach</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right - Wildlife with image */}
                    <div className="absolute top-[130px] sm:top-[180px] md:top-[220px] right-[5px] sm:right-[20px] md:right-[30px] animate-float z-10" style={{ animationDelay: '2s' }}>
                      <div className="relative w-24 h-24 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl">
                        <img 
                          src={destination8} 
                          alt="Wildlife" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-1 left-1 sm:top-2 sm:left-2 md:top-3 md:left-3 flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-full bg-white/95 backdrop-blur-sm shadow-md">
                          <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-primary" />
                          <span className="text-[10px] sm:text-xs md:text-sm font-semibold">Wildlife</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Bottom right - Fine Dining with image */}
                    <div className="absolute bottom-[130px] sm:bottom-[180px] md:bottom-[220px] right-[5px] sm:right-[20px] md:right-[30px] animate-float z-10" style={{ animationDelay: '2.5s' }}>
                      <div className="relative w-24 h-24 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl">
                        <img 
                          src={restaurant1} 
                          alt="Fine Dining" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-1 right-1 sm:top-2 sm:right-2 md:top-3 md:right-3 flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-full bg-white/95 backdrop-blur-sm shadow-md">
                          <UtensilsCrossed className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-accent" />
                          <span className="text-[10px] sm:text-xs md:text-sm font-semibold">Dining</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Bottom left - Historical Tours with image */}
                    <div className="absolute bottom-[130px] sm:bottom-[180px] md:bottom-[220px] left-[5px] sm:left-[20px] md:left-[30px] animate-float z-10" style={{ animationDelay: '3s' }}>
                      <div className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl">
                        <img 
                          src={parisUrban} 
                          alt="Historical Tours" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 md:bottom-3 md:left-3 flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-full bg-white/95 backdrop-blur-sm shadow-md">
                          <MapPinned className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-primary" />
                          <span className="text-[10px] sm:text-xs md:text-sm font-semibold">History</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Bottom center - Water Sports with image */}
                    <div className="absolute bottom-[40px] sm:bottom-[80px] md:bottom-[100px] right-[70px] sm:right-[90px] md:right-[120px] animate-float z-10" style={{ animationDelay: '3.5s' }}>
                      <div className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl">
                        <img 
                          src={icelandNorthernLights} 
                          alt="Water Sports" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 md:bottom-3 md:right-3 flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-full bg-white/95 backdrop-blur-sm shadow-md">
                          <Plane className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-accent" />
                          <span className="text-[10px] sm:text-xs md:text-sm font-semibold">Adventure</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Bottom - Cycling with image */}
                    <div className="absolute bottom-[5px] sm:bottom-[30px] md:bottom-[40px] left-1/2 -translate-x-1/2 animate-float z-10" style={{ animationDelay: '4s' }}>
                      <div className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl">
                        <img 
                          src={cyclingTour} 
                          alt="Professional road bike race - Tour de France style" 
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 md:bottom-3 md:left-3 flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-full bg-white/95 backdrop-blur-sm shadow-md">
                          <Bike className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-primary" />
                          <span className="text-[10px] sm:text-xs md:text-sm font-semibold">Cycling</span>
                        </div>
                      </div>
                    </div>
                    </div>
                    
                    {/* Search input below the visual showcase */}
                    <div className="w-full">
                      <div className="bg-card/95 backdrop-blur-sm rounded-full border-2 border-border shadow-2xl p-2 flex items-center gap-3">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-10 w-10 rounded-full flex-shrink-0"
                        >
                          <Search className="h-5 w-5" />
                        </Button>
                        <input
                          type="text"
                          placeholder="Ask us anything..."
                          className="flex-1 bg-transparent border-0 outline-none text-base placeholder:text-muted-foreground"
                          onClick={() => {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            const input = document.querySelector('input[placeholder*="Where"]') as HTMLInputElement;
                            input?.focus();
                          }}
                        />
                        <Button
                          size="icon"
                          className="h-10 w-10 rounded-full flex-shrink-0 bg-foreground hover:bg-foreground/90"
                        >
                          <Send className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Inspiration Content - Far below the fold */}
            <div className="px-6 pb-12 pt-20">
              <div className="w-full max-w-7xl mx-auto space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent font-chiffon">
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
                      onClick={() => handleInspirationClick(destination)}
                    />
                  ))}
                </div>
              </div>

              {/* Featured Restaurants */}
              <div className="space-y-6 pt-12">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-accent via-primary to-accent bg-clip-text text-transparent font-chiffon">
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
                      className="group relative overflow-hidden transition-all duration-500 hover:shadow-2xl border border-accent/20"
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
                      <div className="absolute bottom-0 left-0 right-0 p-6 text-white space-y-3">
                        <div>
                          <h3 className="text-2xl font-bold mb-1">{restaurant.title}</h3>
                          <p className="text-sm text-accent mb-2">{restaurant.cuisine}</p>
                          <p className="text-sm text-white/80 line-clamp-2">{restaurant.description}</p>
                        </div>
                        <Button 
                          onClick={(e) => {
                            e.stopPropagation();
                            const query = encodeURIComponent(`${restaurant.title} ${restaurant.address} reservations`);
                            const reservationUrl = `https://www.google.com/search?q=${query}`;
                            window.open(reservationUrl, '_blank', 'noopener,noreferrer');
                          }}
                          className="w-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                          size="sm"
                        >
                          <UtensilsCrossed className="h-4 w-4 mr-2" />
                          Make Reservation
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Featured Flights */}
              <div className="space-y-6 pt-12">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent font-chiffon">
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

              {/* Become a Travel Agent CTA */}
              <div className="pt-12 pb-8">
                <Card className="relative overflow-hidden border border-accent/30 bg-gradient-to-r from-accent/5 to-primary/5">
                  <CardContent className="p-8">
                    <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-6">
                      <div className="flex-shrink-0">
                        <div className="inline-block p-2 bg-accent/10 rounded-full">
                          <Briefcase className="h-8 w-8 text-accent" />
                        </div>
                      </div>
                      <div className="flex-1 text-center md:text-left space-y-2">
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent font-chiffon">
                          Become a Travel Agent
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Join our network and earn commissions on luxury travel bookings
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button 
                          size="sm"
                          className="gap-2"
                          onClick={() => {
                            if (user) {
                              navigate('/agent-onboarding');
                            } else {
                              navigate('/auth?redirect=/agent-onboarding');
                            }
                          }}
                        >
                          <Briefcase className="h-4 w-4" />
                          Apply Now
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={() => navigate('/browse-agents')}
                        >
                          <MapPinned className="h-4 w-4" />
                          Browse Agents
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Cuisine Selector - Initial View */}
              {showCuisineSelector && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
                  <CuisineSelector
                    onCuisineSelected={handleCuisineSelected}
                    onCancel={() => setShowCuisineSelector(false)}
                  />
                </div>
              )}
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
                  <img src={logomark} alt="Logo" className="h-8 w-8" />
                </div>
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
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center p-1">
                          <img src={logomark} alt="Goldsainte" className="h-full w-full object-contain" />
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

                {/* Price Slider */}
                {showPriceSlider && (
                  <div className="animate-in fade-in slide-in-from-bottom-4">
                    <PriceSlider
                      type={showPriceSlider.type}
                      onPriceSelected={handlePriceSelected}
                      onCancel={() => setShowPriceSlider(null)}
                      min={showPriceSlider.type === 'restaurant' ? 10 : 50}
                      max={showPriceSlider.type === 'flight' ? 2000 : showPriceSlider.type === 'restaurant' ? 200 : 1000}
                      defaultValue={showPriceSlider.type === 'flight' ? 500 : showPriceSlider.type === 'restaurant' ? 50 : 200}
                    />
                  </div>
                )}

                {/* Cuisine Selector */}
                {showCuisineSelector && (
                  <div className="animate-in fade-in slide-in-from-bottom-4">
                    <CuisineSelector
                      onCuisineSelected={handleCuisineSelected}
                      onCancel={() => setShowCuisineSelector(false)}
                    />
                  </div>
                )}

                {/* Trip Type Selector */}
                {showTripTypeSelector && (
                  <div className="animate-in fade-in slide-in-from-bottom-4" aria-live="polite">
                    <TripTypeSelector
                      onSelect={handleTripTypeSelected}
                      onCancel={() => setShowTripTypeSelector(false)}
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
                              phone={restaurant.phone}
                              website={restaurant.website}
                              hours={restaurant.hours}
                              photos={restaurant.photos}
                              cuisine={restaurant.cuisine}
                              description={restaurant.description}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {result.type === 'flights' && result.results && result.results.length > 0 && (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-4">
                            ✈️ Flights from {typeof result.origin === 'string' ? result.origin : result.origin?.name} to {typeof result.destination === 'string' ? result.destination : result.destination?.name}
                          </h3>
                          <FlightFilters
                            resultsCount={result.results.length}
                            currentSort={result.filters?.sortBy || 'best'}
                            onSortChange={(sortBy) => {
                              const origin = typeof result.origin === 'string' ? result.origin : result.origin?.name;
                              const destination = typeof result.destination === 'string' ? result.destination : result.destination?.name;
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
                              const origin = typeof result.origin === 'string' ? result.origin : result.origin?.name;
                              const destination = typeof result.destination === 'string' ? result.destination : result.destination?.name;
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

                    {result.type === 'events' && result.results.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-foreground">
                          🎫 Upcoming Events
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {result.results.map((event: any, eventIdx: number) => (
                            <EventCard
                              key={event.id || eventIdx}
                              event={event}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {result.type === 'cars' && result.results && result.results.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-foreground">🚗 Rental Cars</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {result.results.map((car: any, carIdx: number) => (
                            <CarCard key={car.id || carIdx} car={car} />
                          ))}
                        </div>
                      </div>
                    )}

                    {result.type === 'package' && result.flights && result.hotels && (
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-foreground">
                          ✨ Complete Travel Packages
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Save up to 10% when booking flights, hotels, and cars together
                        </p>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <PackageCard packageData={{
                            flights: result.flights || [],
                            hotels: result.hotels || [],
                            cars: result.cars || [],
                            origin: typeof result.origin === 'string' ? result.origin : result.origin?.name || '',
                            destination: typeof result.destination === 'string' ? result.destination : result.destination?.name || '',
                            departureDate: result.departureDate || '',
                            returnDate: result.returnDate || '',
                            travelers: result.travelers || 1,
                            estimatedTotal: result.estimatedTotal,
                            savings: result.savings
                          }} />
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
                        placeholder={getPlaceholderText()}
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

        {/* Visa Service Modal */}
        <VisaServiceModal
          open={visaModalData.open}
          onOpenChange={(open) => setVisaModalData(prev => ({ ...prev, open }))}
          fromCountry={visaModalData.fromCountry}
          toCountry={visaModalData.toCountry}
          visaInformation={visaModalData.visaInformation}
        />

        {/* Welcome Modal */}
        <WelcomeModal
          open={showWelcomeModal}
          onClose={() => setShowWelcomeModal(false)}
        />

        {/* Date Picker Modal */}
        {showDatePicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <ChatDatePicker
              type={showDatePicker.type}
              onDatesSelected={handleDatesSelected}
              onCancel={() => setShowDatePicker(null)}
            />
          </div>
        )}
      </div>
    </main>
  );
};

export default Index;
