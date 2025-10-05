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
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  const handleCloseWelcome = () => {
    setShowWelcomeModal(false);
    try { localStorage.setItem('welcomeDismissed', 'true'); } catch {}
  };

  useEffect(() => {
    // Hide welcome modal if logged in, or if previously dismissed
    if (user) {
      setShowWelcomeModal(false);
      return;
    }
    try {
      const dismissed = localStorage.getItem('welcomeDismissed') === 'true';
      setShowWelcomeModal(!dismissed);
    } catch {
      setShowWelcomeModal(true);
    }
  }, [user]);

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
                    Your trip, your way: Book yourself, let AI handle it, or have luxury agents compete for you.
                  </p>
                </div>

                {/* Main Search with rotating placeholder */}
                <div className="relative pt-2 md:pt-3 px-2 md:px-0">
                  <Input
                    placeholder={rotatingMessages[currentMessageIndex]}
                    className="w-full h-14 md:h-16 px-4 pr-14 text-base rounded-3xl border-[#BFAD72] shadow-sm focus-visible:ring-1 focus-visible:ring-[#BFAD72] placeholder:text-xs sm:placeholder:text-sm md:placeholder:text-base placeholder:text-muted-foreground/60 placeholder:transition-opacity placeholder:duration-500"
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
                  <div className="space-y-8 lg:pr-12 pt-12">
                    <div className="space-y-8">
                      {/* Header Section */}
                      <div className="space-y-6 pb-6 border-b border-secondary/20">
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-chiffon font-bold leading-tight text-secondary">
                          Start chatting with us.
                        </h2>
                        <p className="text-xl md:text-2xl text-foreground/80 leading-relaxed font-secondary max-w-2xl">
                          Chat for destinations, build full itineraries, or discover your style — tell us what you love, we'll do the rest.
                        </p>
                      </div>

                      {/* Luxury Features List */}
                      <div className="space-y-6 pt-4">
                        <div className="flex gap-4 items-start group">
                          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-secondary mt-2.5 ring-4 ring-secondary/10 group-hover:ring-secondary/20 transition-all"></div>
                          <p className="text-base md:text-lg text-foreground/70 leading-relaxed font-secondary">
                            AI-powered search across flights, hotels, restaurants, events, and curated packages in one conversation
                          </p>
                        </div>
                        
                        <div className="flex gap-4 items-start group">
                          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-secondary mt-2.5 ring-4 ring-secondary/10 group-hover:ring-secondary/20 transition-all"></div>
                          <p className="text-base md:text-lg text-foreground/70 leading-relaxed font-secondary">
                            Post complex trips to our marketplace and get matched with certified luxury travel agents
                          </p>
                        </div>
                        
                        <div className="flex gap-4 items-start group">
                          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-secondary mt-2.5 ring-4 ring-secondary/10 group-hover:ring-secondary/20 transition-all"></div>
                          <p className="text-base md:text-lg text-foreground/70 leading-relaxed font-secondary">
                            Instant booking with transparent pricing, flexible cancellations, and smart price insights
                          </p>
                        </div>
                        
                        <div className="flex gap-4 items-start group">
                          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-secondary mt-2.5 ring-4 ring-secondary/10 group-hover:ring-secondary/20 transition-all"></div>
                          <p className="text-base md:text-lg text-foreground/70 leading-relaxed font-secondary">
                            Build day-by-day itineraries, upload travel docs, and sync with your calendar
                          </p>
                        </div>
                        
                        <div className="flex gap-4 items-start group">
                          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-secondary mt-2.5 ring-4 ring-secondary/10 group-hover:ring-secondary/20 transition-all"></div>
                          <p className="text-base md:text-lg text-foreground/70 leading-relaxed font-secondary">
                            Real-time messaging hub to chat with agents and manage all bookings in one place
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right side - Decorative gears showcase */}
                  <div className="relative h-[600px] lg:h-[650px]">
                    {/* Decorative Gear Icons - Bottom Left Corner */}
                    <div className="absolute bottom-0 left-0 w-64 h-64">
                      {/* Large Gear 1 - Shopping/Hotel */}
                      <div className="absolute bottom-8 left-0 w-28 h-28 animate-[spin_20s_linear_infinite]">
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                          <path
                            d="M50 0 L55 15 L60 0 L70 5 L70 20 L80 15 L85 25 L95 25 L90 35 L100 40 L95 50 L100 60 L90 65 L95 75 L85 75 L80 85 L70 80 L70 95 L60 100 L55 85 L50 100 L45 85 L40 100 L30 95 L30 80 L20 85 L15 75 L5 75 L10 65 L0 60 L5 50 L0 40 L10 35 L5 25 L15 25 L20 15 L30 20 L30 5 L40 0 L45 15Z"
                            fill="#BFAD72"
                            className="drop-shadow-xl"
                          />
                          <circle cx="50" cy="50" r="25" fill="#0C4D47" />
                          <foreignObject x="32" y="32" width="36" height="36">
                            <div className="flex items-center justify-center h-full">
                              <Hotel className="h-5 w-5 text-[#BFAD72]" />
                            </div>
                          </foreignObject>
                        </svg>
                      </div>

                      {/* Medium Gear 2 - Dining */}
                      <div className="absolute bottom-16 left-20 w-24 h-24 animate-[spin_15s_linear_infinite_reverse]">
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                          <path
                            d="M50 5 L54 18 L58 5 L66 9 L66 22 L74 18 L78 27 L86 27 L82 36 L90 40 L86 50 L90 60 L82 64 L86 73 L78 73 L74 82 L66 78 L66 91 L58 95 L54 82 L50 95 L46 82 L42 95 L34 91 L34 78 L26 82 L22 73 L14 73 L18 64 L10 60 L14 50 L10 40 L18 36 L14 27 L22 27 L26 18 L34 22 L34 9 L42 5 L46 18Z"
                            fill="#BFAD72"
                            className="drop-shadow-xl"
                          />
                          <circle cx="50" cy="50" r="22" fill="#0C4D47" />
                          <foreignObject x="34" y="34" width="32" height="32">
                            <div className="flex items-center justify-center h-full">
                              <UtensilsCrossed className="h-4 w-4 text-[#BFAD72]" />
                            </div>
                          </foreignObject>
                        </svg>
                      </div>

                      {/* Small Gear 3 - Flights */}
                      <div className="absolute bottom-4 left-24 w-20 h-20 animate-[spin_12s_linear_infinite]">
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                          <path
                            d="M50 8 L53 20 L56 8 L62 11 L62 23 L68 20 L71 27 L77 27 L74 34 L80 38 L77 50 L80 62 L74 66 L77 73 L71 73 L68 80 L62 77 L62 89 L56 92 L53 80 L50 92 L47 80 L44 92 L38 89 L38 77 L32 80 L29 73 L23 73 L26 66 L20 62 L23 50 L20 38 L26 34 L23 27 L29 27 L32 20 L38 23 L38 11 L44 8 L47 20Z"
                            fill="#BFAD72"
                            className="drop-shadow-xl"
                          />
                          <circle cx="50" cy="50" r="20" fill="#0C4D47" />
                          <foreignObject x="36" y="36" width="28" height="28">
                            <div className="flex items-center justify-center h-full">
                              <Plane className="h-4 w-4 text-[#BFAD72]" />
                            </div>
                          </foreignObject>
                        </svg>
                      </div>

                      {/* Extra Small Gear 4 - Events */}
                      <div className="absolute bottom-24 left-12 w-16 h-16 animate-[spin_18s_linear_infinite_reverse]">
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                          <path
                            d="M50 10 L52 22 L54 10 L59 13 L59 25 L64 22 L66 28 L72 28 L70 35 L75 39 L72 50 L75 61 L70 65 L72 72 L66 72 L64 78 L59 75 L59 87 L54 90 L52 78 L50 90 L48 78 L46 90 L41 87 L41 75 L36 78 L34 72 L28 72 L30 65 L25 61 L28 50 L25 39 L30 35 L28 28 L34 28 L36 22 L41 25 L41 13 L46 10 L48 22Z"
                            fill="#BFAD72"
                            className="drop-shadow-xl"
                          />
                          <circle cx="50" cy="50" r="18" fill="#0C4D47" />
                          <foreignObject x="38" y="38" width="24" height="24">
                            <div className="flex items-center justify-center h-full">
                              <Ticket className="h-3 w-3 text-[#BFAD72]" />
                            </div>
                          </foreignObject>
                        </svg>
                      </div>

                      {/* Extra Small Gear 5 - Cars */}
                      <div className="absolute bottom-0 left-16 w-16 h-16 animate-[spin_14s_linear_infinite]">
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                          <path
                            d="M50 10 L52 22 L54 10 L59 13 L59 25 L64 22 L66 28 L72 28 L70 35 L75 39 L72 50 L75 61 L70 65 L72 72 L66 72 L64 78 L59 75 L59 87 L54 90 L52 78 L50 90 L48 78 L46 90 L41 87 L41 75 L36 78 L34 72 L28 72 L30 65 L25 61 L28 50 L25 39 L30 35 L28 28 L34 28 L36 22 L41 25 L41 13 L46 10 L48 22Z"
                            fill="#BFAD72"
                            className="drop-shadow-xl"
                          />
                          <circle cx="50" cy="50" r="18" fill="#0C4D47" />
                          <foreignObject x="38" y="38" width="24" height="24">
                            <div className="flex items-center justify-center h-full">
                              <Car className="h-3 w-3 text-[#BFAD72]" />
                            </div>
                          </foreignObject>
                        </svg>
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
          onClose={handleCloseWelcome}
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
