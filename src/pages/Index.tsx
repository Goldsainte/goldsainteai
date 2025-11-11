import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Plane, 
  Hotel, 
  MapPin, 
  UtensilsCrossed, 
  Search, 
  Send, 
  Loader2, 
  Sparkles, 
  ArrowLeft, 
  MapPinned, 
  Star,
  FileCheck, 
  Ticket, 
  Car, 
  Briefcase, 
  Bike, 
  MessageCircle,
  ArrowRight,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CompactHotelCard } from "@/components/CompactHotelCard";
import { WelcomeModal } from "@/components/WelcomeModal";
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
import { BookingModal } from "@/components/BookingModal";
import { CarCard } from "@/components/CarCard";
import { FineDiningHero } from "@/components/FineDiningHero";
import { useExpediaModal } from '@/contexts/ExpediaModalContext';



import { FromTheJournal } from "@/components/FromTheJournal";
import { WinterSunHero } from "@/components/WinterSunHero";
import { ThreeGridGallery } from "@/components/ThreeGridGallery";
import { HotelScrollSection } from "@/components/HotelScrollSection";
import { RestaurantScrollSection } from "@/components/RestaurantScrollSection";
import { PopularSearchGrid } from "@/components/PopularSearchGrid";
import { europeHotels, usHotels } from "@/data/hotelsData";
import { topUSRestaurants } from "@/data/restaurantsData";
import logomark from "@/assets/logomark-seal-gold.png";
import luxuryAiHero from "@/assets/luxury-ai-hero.jpg";

import cardAiSearch from "@/assets/card-ai-search.jpg";
import cardExpertAgents from "@/assets/card-expert-agents.jpg";
import cardInstantBooking from "@/assets/card-instant-booking-phone.png";
import cardItinerary from "@/assets/card-itinerary.jpg";
import cardMessaging from "@/assets/card-messaging-chatting.png";
import flight1 from "@/assets/flight1.jpg";
import flight2 from "@/assets/flight2.jpg";
import flight3 from "@/assets/flight3.jpg";
import luxuryHotels from "@/assets/luxury-hotels.jpg";
import luxuryRestaurants from "@/assets/luxury-restaurants.jpg";
import luxuryVisa from "@/assets/luxury-visa.jpg";
import luxuryEvents from "@/assets/luxury-events.jpg";
import destination7 from "@/assets/destination7.jpg";
import destination8 from "@/assets/destination8.jpg";
import cyclingTour from "@/assets/cycling-tour.jpg";
import spaWellness from "@/assets/spa-wellness.jpg";
import property1 from "@/assets/property1.jpg";
import property2 from "@/assets/property2.jpg";
import property3 from "@/assets/property3.jpg";
import property4 from "@/assets/property4.jpg";
import property5 from "@/assets/property5.jpg";
import creatorYachtParty from "@/assets/creator-yacht-party.jpg";
import creatorBeachSelfie from "@/assets/creator-beach-selfie.jpg";
import creatorRoadTrip from "@/assets/creator-road-trip.jpg";
import creatorMountainGroup from "@/assets/creator-mountain-group.jpg";
import creatorCanyonViews from "@/assets/creator-canyon-views.jpg";
import creatorDesertCamel from "@/assets/creator-desert-camel.jpg";
import creatorSnowPhotography from "@/assets/creator-snow-photography.jpg";
import { useToast } from "@/hooks/use-toast";
import { invokeEdgeFunction } from "@/lib/edgeFunctionHelpers";
import VendorPromotionFeed from "@/components/VendorPromotionFeed";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  searchResults?: SearchResult[];
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
  const { t } = useTranslation();
  const { openModal: openExpediaModal } = useExpediaModal();
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userCountry, setUserCountry] = useState<string>('US'); // Default to US
  const [packageBookingData, setPackageBookingData] = useState<any>(null);
  const [showDatePicker, setShowDatePicker] = useState<{ type: "hotel" | "flight"; context: string; suggestedDate?: Date } | null>(null);
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
  const [activeQuickLink, setActiveQuickLink] = useState<"hotels" | "flights" | "activities" | "events" | null>(null);
  const [usePreferences, setUsePreferences] = useState(true);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const rotatingMessages = [
    t('home.rotatingPlaceholders.hotels'),
    t('home.rotatingPlaceholders.flights'),
    t('home.rotatingPlaceholders.restaurants'),
    t('home.rotatingPlaceholders.events'),
    t('home.rotatingPlaceholders.excursions'),
    t('home.rotatingPlaceholders.agents')
  ];

  // Handle service query parameter from Header
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const service = params.get('service');
    
    if (service && ['hotels', 'flights', 'activities', 'events'].includes(service)) {
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
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation({ lat, lng });
          console.log('Location detected:', lat, lng);
          
          // Reverse geocode to get country
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
            );
            const data = await response.json();
            const country = data.address?.country_code?.toUpperCase() || 'US';
            setUserCountry(country);
            console.log('Country detected:', country);
          } catch (error) {
            console.error('Failed to reverse geocode:', error);
          }
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
    if (isLoading) {
      toast({ title: "Still working", description: "Please wait for the current response to finish." });
      return;
    }
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
    setMessages(prev => [...prev, { role: 'user', content: queryToSend }]);
    setSearchQuery("");

    try {
      const { data, error } = await invokeEdgeFunction('travel-ai-agent', {
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
        },
        timeout: 60000, // 60 second timeout for AI calls
        showToastOnError: true,
      });

      if (error) {
        // Error already handled by invokeEdgeFunction
        setIsLoading(false);
        return;
      }

      // Ignore stale responses
      if (requestId !== lastRequestIdRef.current) return;

      // Filter and attach search results to the assistant message
      let filteredResults: SearchResult[] = [];
      if (data.toolResults && data.toolResults.length > 0) {
        // Check for hotel intent (intent extraction only, no actual results)
        const hotelIntent = data.toolResults.find((r: any) => 
          r.search_type === 'hotels' && r.status === 'OK' && r.search_params && !r.results
        );
        
        // Check for flight intent (intent extraction only, no actual results)
        const flightIntent = data.toolResults.find((r: any) => 
          r.search_type === 'flights' && r.status === 'OK' && r.search_params && !r.results
        );
        
        // Open Expedia modal with prefilled data if we have hotel or flight intent
        if (hotelIntent) {
          openExpediaModal({
            destination: hotelIntent.search_params.location || '',
            checkIn: hotelIntent.search_params.checkIn || '',
            checkOut: hotelIntent.search_params.checkOut || '',
            adults: parseInt(hotelIntent.search_params.guests?.toString() || '2'),
            children: 0,
          });
        } else if (flightIntent) {
          openExpediaModal({
            destination: flightIntent.search_params.destination || '',
            checkIn: flightIntent.search_params.departureDate || '',
            checkOut: flightIntent.search_params.returnDate || '',
            adults: parseInt(flightIntent.search_params.adults?.toString() || '1'),
            children: 0,
          });
        }
        
        // Filter out intent-only results (no actual hotel/flight data) from rendering
        filteredResults = data.toolResults.filter((r: any) => {
          // Exclude intent-only responses (have status OK, search_params, but no results array)
          if (r.status === 'OK' && r.search_params && !r.results) {
            return false;
          }
          
          // Include package results that have content
          if (r?.type === 'package') {
            const total = (r.flights?.length || 0) + (r.hotels?.length || 0) + (r.cars?.length || 0);
            return total > 0;
          }
          
          // Include results with actual data
          if (Array.isArray(r?.results)) {
            return r.results.length > 0;
          }
          
          // Include visa results
          if (r?.type === 'visa') {
            return !!(r.information || r.requirement);
          }
          
          return false;
        });
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.message, 
        searchResults: filteredResults.length > 0 ? filteredResults : undefined,
        ...(data.quickLinkState && { quickLinkState: data.quickLinkState }) 
      }]);
      setActiveQuickLink(null);
        
      // Check for visa results
      const visaResult = data.toolResults?.find((r: any) => r.type === 'visa');
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
        const suggestedDate = extractSuggestedDate();
        setTimeout(() => setShowDatePicker({ type, context: 'quicklink', suggestedDate }), 500);
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
        // Restrict selector strictly to Flights context
        const isFlightsContext = activeQuickLink === 'flights';
        
        if (!tripTypeResolvedRef.current && !showTripTypeSelector && isFlightsContext) {
          setTimeout(() => setShowTripTypeSelector(true), 500);
        }
      }
    } catch (err: any) {
      console.error('AI Agent error:', err);
      console.error('Error details:', JSON.stringify(err, null, 2));
      // Only show generic error if not already handled by invokeEdgeFunction
      if (!err.type) {
        toast({
          title: "Error",
          description: err.message || err.error?.message || "Failed to process your request. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      if (requestId === lastRequestIdRef.current) setIsLoading(false);
    }
  };

  // Helper to extract year/date from recent messages
  const extractSuggestedDate = (): Date | undefined => {
    // Look at ALL messages including the most recent ones
    const allMessages = [...conversationHistory, ...messages];
    const conversationText = allMessages.map(m => m.content).join(' ').toLowerCase();
    
    console.log('Extracting date from conversation:', conversationText);
    
    // Match year patterns (2024-2039) - look for the LAST occurrence
    const yearMatches = conversationText.match(/\b(202[4-9]|203[0-9])\b/g);
    const year = yearMatches ? parseInt(yearMatches[yearMatches.length - 1]) : new Date().getFullYear();
    
    console.log('Found year:', year);
    
    // Match month patterns (January, Jan, July, etc.)
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const monthShort = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    let monthIndex = -1;
    
    // Look for month mentions from most recent to oldest
    for (let i = allMessages.length - 1; i >= 0; i--) {
      const msgText = allMessages[i].content.toLowerCase();
      for (let j = 0; j < monthNames.length; j++) {
        if (msgText.includes(monthNames[j]) || msgText.includes(monthShort[j])) {
          monthIndex = j;
          break;
        }
      }
      if (monthIndex !== -1) break;
    }
    
    console.log('Found month index:', monthIndex);
    
    // If we found a year or month, create a suggested date
    if (yearMatches || monthIndex !== -1) {
      const month = monthIndex !== -1 ? monthIndex : new Date().getMonth();
      const suggestedDate = new Date(year, month, 1);
      console.log('Created suggested date:', suggestedDate);
      return suggestedDate;
    }
    
    return undefined;
  };

  const handleDatePickerRequest = (type: "hotel" | "flight", context: string) => {
    console.log('Quick action date picker requested:', { type, context });
    toast({
      title: type === "hotel" ? "Select your stay dates" : "Select your flight dates",
      description: "Pick dates to continue.",
    });
    const suggestedDate = extractSuggestedDate();
    setShowDatePicker({ type, context, suggestedDate });
  };

  const handleCalendarClick = () => {
    // Determine type based on context
    let type: 'hotel' | 'flight' = 'hotel';
    
    if (activeQuickLink === 'flights') {
      type = 'flight';
    } else if (activeQuickLink === 'hotels') {
      type = 'hotel';
    }
    
    // Open date picker
    const suggestedDate = extractSuggestedDate();
    setShowDatePicker({ type, context: 'manual', suggestedDate });
  };

  const handleDatesSelected = async (dates: { checkIn?: string; checkOut?: string; departureDate?: string; returnDate?: string }) => {
    if (!showDatePicker) return;

    const { type } = showDatePicker;
    setShowDatePicker(null);

    let dateQuery = '';
    
    if (type === "hotel" && dates.checkIn && dates.checkOut) {
      dateQuery = `${dates.checkIn} to ${dates.checkOut}`;
    } else if (type === "flight") {
      if (dates.departureDate && dates.returnDate) {
        dateQuery = `departing ${dates.departureDate} returning ${dates.returnDate}`;
      } else if (dates.departureDate) {
        dateQuery = `departing ${dates.departureDate}`;
      }
    }

    // If there's existing text in search query, append dates; otherwise use dates as query
    const finalQuery = searchQuery.trim() 
      ? `${searchQuery.trim()} ${dateQuery}` 
      : dateQuery;
    
    // Update search query to show selected dates
    setSearchQuery(finalQuery);
    
    // Automatically trigger search with the dates
    handleSearch(finalQuery);
  };

  const handleQuickAction = async (action: string) => {
const queries = {
      hotels: "I'm looking for hotels",
      flights: "I need to find flights",
      activities: "I'm looking for activities and things to do",
      events: "I want to find events and concerts"
    };
    const query = queries[action as keyof typeof queries];
    console.log('Quick action selected:', action, '->', query);
    
    setIsLoading(true);
    setMessages([{ role: 'user', content: query }]);

    const requestId = ++lastRequestIdRef.current;

    try {
      setActiveQuickLink(action as "hotels" | "flights" | "activities" | "events");
      const { data, error } = await invokeEdgeFunction('travel-ai-agent', {
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
        },
        timeout: 60000,
        showToastOnError: true,
      });

      if (error) throw error;

      // Ignore stale responses
      if (requestId !== lastRequestIdRef.current) return;

      let filteredResults: SearchResult[] = [];
      if (data.toolResults && data.toolResults.length > 0) {
        filteredResults = data.toolResults.filter((r: any) => {
          if (r?.type === 'package') {
            const total = (r.flights?.length || 0) + (r.hotels?.length || 0) + (r.cars?.length || 0);
            return total > 0;
          }
          if (Array.isArray(r?.results)) {
            return r.results.length > 0;
          }
          if (r?.type === 'visa') {
            return !!(r.information || r.requirement);
          }
          return false;
        });
      }

      setMessages([
        { role: 'user', content: query },
        { 
          role: 'assistant', 
          content: data.message,
          searchResults: filteredResults.length > 0 ? filteredResults : undefined,
          ...(data.quickLinkState && { quickLinkState: data.quickLinkState })
        }
      ]);
      setActiveQuickLink(null);
      
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
        const suggestedDate = extractSuggestedDate();
        setTimeout(() => setShowDatePicker((prev) => prev ?? { type, context: 'quicklink', suggestedDate }), 500);
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
        // Restrict selector strictly to Flights context
        const isFlightsContext = activeQuickLink === 'flights';
        
        if (!tripTypeResolvedRef.current && !showTripTypeSelector && isFlightsContext) {
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

  const resetChat = () => {
    setMessages([]);
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
    if (activeQuickLink === 'activities') return 'Ask about activities, tours, or things to do...';
    if (activeQuickLink === 'events') return 'Ask about events, concerts, shows, or entertainment...';
    return 'Ask me anything about travel...';
  };

  const showChat = messages.length > 0;

  return (
    <main className="min-h-screen w-full max-w-full flex flex-col flex-1 items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 xl:px-40 overflow-x-hidden box-border">
      <div className="w-full max-w-full flex-1 flex flex-col overflow-x-hidden">
        {!showChat ? (
          // Initial search view - ChatGPT style centered
          <div className="flex-1 flex flex-col">
            {/* Centered Search Area */}
            <div className="min-h-screen flex items-center justify-center px-4 py-8">
              <div className="w-full max-w-2xl space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Logo and Title */}
                <div className="flex flex-col items-center justify-center space-y-4 md:space-y-3">
                  <img 
                    src={logomark} 
                    alt="Goldsainte.Ai logo" 
                    className="h-20 w-20 md:h-16 md:w-16"
                    width="80"
                    height="80"
                  />
                  <h1 className="text-base md:text-lg font-medium text-center text-foreground max-w-xl px-4 leading-relaxed">
                    {t('home.hero.title')}
                  </h1>
                  <p className="text-sm md:text-base text-center text-muted-foreground max-w-xl px-4 leading-relaxed">
                    {t('home.hero.subtitle')}
                  </p>
                </div>

                {/* Main Search with rotating placeholder */}
                <div className="w-full flex justify-center px-4" data-tour="ai-search">
                  <div
                    className="relative"
                    style={{ width: 'clamp(320px, 60vw, 960px)' }}
                  >
                    <label htmlFor="ai-search-input" className="sr-only">Search for travel experiences</label>
                    <Input
                      id="ai-search-input"
                      type="search"
                      placeholder={rotatingMessages[currentMessageIndex]}
                      className="w-full rounded-full border border-[#D8C89B] bg-white/90 backdrop-blur shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0E4B44]/30 focus:border-[#0E4B44] placeholder:text-gray-500 placeholder:text-[8px] sm:placeholder:text-[17px] lg:placeholder:text-lg text-gray-900 transition h-[52px] sm:h-14 lg:h-16 pl-4 sm:pl-5 pr-14 sm:pr-16 text-base sm:text-[17px] lg:text-lg leading-[1.25] touch-manipulation"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={isLoading}
                      aria-label="Search for travel experiences, hotels, flights, and more"
                    />
                    <Button
                      onClick={() => handleSearch()}
                      type="submit"
                      className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-[#0E4B44] text-white flex items-center justify-center hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0E4B44] touch-manipulation disabled:opacity-50"
                      disabled={isLoading}
                      aria-label="Submit search"
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                      ) : (
                        <Send className="h-5 w-5" aria-hidden="true" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* What Goldsainte.Ai Can Do Button (Original style) */}
                <div className="flex justify-center pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowWelcomeModal(true)}
                    className="border-2 border-secondary bg-transparent hover:bg-secondary/10 rounded-full h-12 px-6 sm:px-8 gap-2 font-secondary"
                    style={{ color: '#0c4d47' }}
                  >
                    <Sparkles className="h-4 w-4" style={{ color: '#0c4d47' }} />
                    {t('home.hero.whatCanDo')}
                  </Button>
                </div>

                {/* Footer */}
                <p className="text-sm text-muted-foreground text-center pt-4 px-4 leading-relaxed">
                  {t('home.hero.agreement')}{" "}
                  <a href="#" className="underline hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary rounded-sm">{t('home.hero.terms')}</a>
                  {" "}{t('common.and')}{" "}
                  <a href="#" className="underline hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary rounded-sm">{t('home.hero.privacy')}</a>
                </p>
              </div>
            </div>

            {/* How it Works Section - Horizontal Scrolling */}
            <section className="px-4 sm:px-6 py-20 md:py-24 bg-white" aria-labelledby="how-it-works-heading">
              <div className="w-full max-w-7xl mx-auto space-y-12 md:space-y-16">
                <div className="text-left space-y-6 px-2">
                  <div>
                    <h2 id="how-it-works-heading" className="font-secondary text-5xl md:text-6xl font-light leading-tight text-primary mb-4">
                      {t('home.howItWorks.title')}
                    </h2>
                    <div className="w-20 h-1 bg-luxury-gold" />
                  </div>
                  <div className="text-lg md:text-xl leading-relaxed text-muted-foreground/90 font-secondary space-y-6">
                    <p>
                      {t('home.howItWorks.intro')}
                    </p>
            <p>
              {t('home.howItWorks.paragraph1')}
            </p>
            <p>
              {t('home.howItWorks.paragraph2')}
            </p>
            <p>
              {t('home.howItWorks.paragraph3')}
            </p>
            <p>
              {t('home.howItWorks.paragraph4')}
            </p>
            <p>
              {t('home.howItWorks.paragraph5')}
            </p>
            <p>
              {t('home.howItWorks.tagline')}<br />
              {t('home.howItWorks.subtitle')}
            </p>
                  </div>
                </div>

                {/* Horizontal scrolling feature cards */}
                <div className="relative w-full overflow-hidden">
                  <div 
                    className="overflow-x-auto scrollbar-hide snap-x snap-mandatory touch-pan-x pb-2 -mx-4 sm:-mx-6 px-4 sm:px-6"
                    style={{ 
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                      WebkitOverflowScrolling: 'touch'
                    }}
                  >
                    <div className="flex gap-6 md:gap-8 min-w-max">
                      {/* Card 1: Voice AI Search */}
                      <Card className="group relative overflow-hidden snap-start w-[280px] sm:w-[300px] md:w-[340px] flex-shrink-0 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 bg-white border-luxury-cream/30 p-6 md:p-8">
                        <div className="relative h-44 sm:h-48 md:h-52 mb-4 sm:mb-5 md:mb-6 rounded-xl overflow-hidden bg-gradient-to-br from-muted to-muted/50">
                          <img
                            src={cardAiSearch}
                            alt="AI-powered voice search interface for luxury travel planning"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        </div>
                        <CardContent className="p-0 space-y-3 sm:space-y-4">
                          <h3 className="text-xl md:text-2xl font-medium font-secondary leading-tight text-primary">
                            {t('home.features.voiceAI.title')}
                          </h3>
                          <p className="text-base text-muted-foreground/90 leading-relaxed">
                            {t('home.features.voiceAI.description')}
                          </p>
                          <button 
                            className="group inline-flex items-center gap-2 text-luxury-gold hover:text-luxury-gold/80 transition-colors font-medium text-base"
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                          >
                            {t('home.features.voiceAI.cta')}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </button>
                        </CardContent>
                      </Card>

                      {/* Card 2: CoCurated Itineraries */}
                      <Card className="group relative overflow-hidden snap-start w-[280px] sm:w-[300px] md:w-[340px] flex-shrink-0 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 bg-white border-luxury-cream/30 p-6 md:p-8">
                        <div className="relative h-44 sm:h-48 md:h-52 mb-4 sm:mb-5 md:mb-6 rounded-xl overflow-hidden bg-gradient-to-br from-muted to-muted/50">
                          <img
                            src={cardItinerary}
                            alt="Personalized luxury travel itinerary with curated recommendations"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        </div>
                        <CardContent className="p-0 space-y-3 sm:space-y-4">
                          <h3 className="text-xl md:text-2xl font-medium font-secondary leading-tight text-primary">
                            {t('home.features.cocurated.title')}
                          </h3>
                          <p className="text-base text-muted-foreground/90 leading-relaxed">
                            {t('home.features.cocurated.description')}
                          </p>
                          <button 
                            className="group inline-flex items-center gap-2 text-luxury-gold hover:text-luxury-gold/80 transition-colors font-medium text-base"
                            onClick={() => navigate('/itineraries')}
                          >
                            {t('home.features.cocurated.cta')}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </button>
                        </CardContent>
                      </Card>

                      {/* Card 3: Creator Social Network */}
                      <Card className="group relative overflow-hidden snap-start w-[280px] sm:w-[300px] md:w-[340px] flex-shrink-0 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 bg-white border-luxury-cream/30 p-6 md:p-8">
                        <div className="relative h-44 sm:h-48 md:h-52 mb-4 sm:mb-5 md:mb-6 rounded-xl overflow-hidden bg-gradient-to-br from-muted to-muted/50">
                          <img
                            src={cardMessaging}
                            alt="Travel creator community sharing luxury destination insights"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        </div>
                        <CardContent className="p-0 space-y-3 sm:space-y-4">
                          <h3 className="text-xl md:text-2xl font-medium font-secondary leading-tight text-primary">
                            {t('home.features.social.title')}
                          </h3>
                          <p className="text-base text-muted-foreground/90 leading-relaxed">
                            {t('home.features.social.description')}
                          </p>
                          <button 
                            className="group inline-flex items-center gap-2 text-luxury-gold hover:text-luxury-gold/80 transition-colors font-medium text-base"
                            onClick={() => navigate('/social-feed')}
                          >
                            {t('home.features.social.cta')}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </button>
                        </CardContent>
                      </Card>

                      {/* Card 4: Expert Agent Support */}
                      <Card className="group relative overflow-hidden snap-start w-[280px] sm:w-[300px] md:w-[340px] flex-shrink-0 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 bg-white border-luxury-cream/30 p-6 md:p-8">
                        <div className="relative h-44 sm:h-48 md:h-52 mb-4 sm:mb-5 md:mb-6 rounded-xl overflow-hidden bg-gradient-to-br from-muted to-muted/50">
                          <img
                            src={cardExpertAgents}
                            alt="Professional travel agent providing personalized luxury travel consultation"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        </div>
                        <CardContent className="p-0 space-y-3 sm:space-y-4">
                          <h3 className="text-xl md:text-2xl font-medium font-secondary leading-tight text-primary">
                            {t('home.features.agents.title')}
                          </h3>
                          <p className="text-base text-muted-foreground/90 leading-relaxed">
                            {t('home.features.agents.description')}
                          </p>
                          <button 
                            className="group inline-flex items-center gap-2 text-luxury-gold hover:text-luxury-gold/80 transition-colors font-medium text-base"
                            onClick={() => navigate('/agents')}
                          >
                            {t('home.features.agents.cta')}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </button>
                        </CardContent>
                      </Card>

                      {/* Card 5: Instant Booking */}
                      <Card className="group relative overflow-hidden snap-start w-[280px] sm:w-[300px] md:w-[340px] flex-shrink-0 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 bg-white border-luxury-cream/30 p-6 md:p-8">
                        <div className="relative h-44 sm:h-48 md:h-52 mb-4 sm:mb-5 md:mb-6 rounded-xl overflow-hidden bg-gradient-to-br from-muted to-muted/50">
                          <img
                            src={cardInstantBooking}
                            alt="Seamless booking interface for luxury hotels and travel experiences"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        </div>
                        <CardContent className="p-0 space-y-3 sm:space-y-4">
                          <h3 className="text-xl md:text-2xl font-medium font-secondary leading-tight text-primary">
                            {t('home.features.instant.title')}
                          </h3>
                          <p className="text-base text-muted-foreground/90 leading-relaxed">
                            {t('home.features.instant.description')}
                          </p>
                          <button 
                            className="group inline-flex items-center gap-2 text-luxury-gold hover:text-luxury-gold/80 transition-colors font-medium text-base"
                            onClick={() => navigate('/hotels')}
                          >
                            {t('home.features.instant.cta')}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </button>
                        </CardContent>
                      </Card>

                      {/* Card 6: Creator Stores */}
                      <Card className="group relative overflow-hidden snap-start w-[280px] sm:w-[300px] md:w-[340px] flex-shrink-0 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 bg-white border-luxury-cream/30 p-6 md:p-8">
                        <div className="relative h-44 sm:h-48 md:h-52 mb-4 sm:mb-5 md:mb-6 rounded-xl overflow-hidden bg-gradient-to-br from-muted to-muted/50">
                          <img
                            src={creatorDesertCamel}
                            alt="Travel creator's curated destination storefront with luxury recommendations"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        </div>
                        <CardContent className="p-0 space-y-3 sm:space-y-4">
                          <h3 className="text-xl md:text-2xl font-medium font-secondary leading-tight text-primary">
                            {t('home.features.stores.title')}
                          </h3>
                          <p className="text-base text-muted-foreground/90 leading-relaxed">
                            {t('home.features.stores.description')}
                          </p>
                          <button 
                            className="group inline-flex items-center gap-2 text-luxury-gold hover:text-luxury-gold/80 transition-colors font-medium text-base"
                            onClick={() => navigate('/creators')}
                          >
                            {t('home.features.stores.cta')}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </button>
                        </CardContent>
                      </Card>

                      {/* Padding element to ensure last card is fully visible */}
                      <div className="flex-shrink-0 w-6" aria-hidden="true"></div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Creator Hero Section */}
            <section className="px-4 sm:px-6 py-20 md:py-24 bg-white" aria-labelledby="creator-section-heading">
              <div className="w-full max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                  {/* Left: Text Content */}
                  <div className="space-y-8">
                    <div>
                      <div className="space-y-3">
                        <h2 id="creator-section-heading" className="font-secondary text-5xl md:text-6xl lg:text-7xl font-light text-foreground leading-tight">
                          {t('home.creatorHero.create')}
                        </h2>
                        <h2 className="font-secondary text-5xl md:text-6xl lg:text-7xl font-light text-foreground leading-tight" aria-label="Share">
                          {t('home.creatorHero.share')}
                        </h2>
                        <h2 className="font-secondary text-5xl md:text-6xl lg:text-7xl font-light text-luxury-gold leading-tight" aria-label="Make Money">
                          {t('home.creatorHero.makeMoney')}
                        </h2>
                      </div>
                      <div className="w-24 h-1 bg-luxury-gold mt-6" />
                    </div>
                    
                    <div className="text-lg md:text-xl leading-relaxed text-muted-foreground/90 space-y-6">
                      <p>
                        {t('home.creatorHero.paragraph1')}
                      </p>
                      <p>
                        {t('home.creatorHero.paragraph2')}
                      </p>
                      <p>
                        {t('home.creatorHero.paragraph3')}
                      </p>
                    </div>
                  </div>

                  {/* Right: Photo Collage */}
                  <div className="relative h-[500px] sm:h-[550px] lg:h-[650px]" role="img" aria-label="Collage of creator lifestyle images showing luxury travel experiences">
                    
                    {/* Mobile & Tablet: Clean 2-column grid */}
                    <div className="lg:hidden grid grid-cols-2 gap-2 h-full">
                      <div className="rounded-xl overflow-hidden shadow-lg active:scale-[0.98] transition-transform">
                        <img 
                          src={creatorRoadTrip} 
                          alt="Travel creators on road trip adventure with vintage Land Rover" 
                          className="w-full h-full object-cover" 
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                      <div className="rounded-xl overflow-hidden shadow-lg active:scale-[0.98] transition-transform">
                        <img 
                          src={creatorYachtParty} 
                          alt="Content creators enjoying yacht lifestyle" 
                          className="w-full h-full object-cover" 
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                      <div className="rounded-xl overflow-hidden shadow-lg active:scale-[0.98] transition-transform">
                        <img 
                          src={creatorMountainGroup} 
                          alt="Group of friends creating travel content in mountain adventure" 
                          className="w-full h-full object-cover" 
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                      <div className="rounded-xl overflow-hidden shadow-lg active:scale-[0.98] transition-transform">
                        <img 
                          src={creatorBeachSelfie} 
                          alt="Creator capturing beach content at sunset" 
                          className="w-full h-full object-cover" 
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                      <div className="rounded-xl overflow-hidden shadow-lg active:scale-[0.98] transition-transform">
                        <img 
                          src={creatorCanyonViews} 
                          alt="Creators capturing scenic canyon views together" 
                          className="w-full h-full object-cover" 
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                      <div className="rounded-xl overflow-hidden shadow-lg active:scale-[0.98] transition-transform">
                        <img 
                          src={creatorSnowPhotography} 
                          alt="Content creators filming winter travel photography" 
                          className="w-full h-full object-cover" 
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                      <div className="col-span-2 rounded-xl overflow-hidden shadow-lg active:scale-[0.98] transition-transform">
                        <img 
                          src={creatorDesertCamel} 
                          alt="Travel creator capturing unique desert content with camel" 
                          className="w-full h-full object-cover" 
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                    </div>

                    {/* Desktop: Artistic collage (original layout) */}
                    <div className="hidden lg:block">
                      <div className="absolute top-0 right-0 w-[42%] h-[32%] rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 ring-1 ring-white/50">
                        <img 
                          src={creatorRoadTrip} 
                          alt="Travel creators on road trip adventure with vintage Land Rover" 
                          className="w-full h-full object-cover" 
                          loading="lazy"
                          decoding="async"
                          width="420"
                          height="320"
                        />
                      </div>
                      <div className="absolute top-[10%] left-0 w-[45%] h-[35%] rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 ring-1 ring-white/50">
                        <img 
                          src={creatorMountainGroup} 
                          alt="Group of friends creating travel content in mountain adventure" 
                          className="w-full h-full object-cover" 
                          loading="lazy"
                          decoding="async"
                          width="450"
                          height="350"
                        />
                      </div>
                      <div className="absolute top-[5%] left-[35%] w-[40%] h-[30%] rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 ring-1 ring-white/50 z-20">
                        <img 
                          src={creatorYachtParty} 
                          alt="Content creators enjoying yacht lifestyle" 
                          className="w-full h-full object-cover" 
                          loading="lazy"
                          decoding="async"
                          width="400"
                          height="300"
                        />
                      </div>
                      <div className="absolute top-[42%] right-[5%] w-[45%] h-[32%] rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 ring-1 ring-white/50">
                        <img 
                          src={creatorCanyonViews} 
                          alt="Creators capturing scenic canyon views together" 
                          className="w-full h-full object-cover" 
                          loading="lazy"
                          decoding="async"
                          width="450"
                          height="320"
                        />
                      </div>
                      <div className="absolute top-[40%] left-[5%] w-[38%] h-[28%] rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 ring-1 ring-white/50 z-10">
                        <img 
                          src={creatorBeachSelfie} 
                          alt="Creator capturing beach content at sunset" 
                          className="w-full h-full object-cover" 
                          loading="lazy"
                          decoding="async"
                          width="380"
                          height="280"
                        />
                      </div>
                      <div className="absolute bottom-0 left-[0%] w-[40%] h-[28%] rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 ring-1 ring-white/50">
                        <img 
                          src={creatorDesertCamel} 
                          alt="Travel creator capturing unique desert content with camel" 
                          className="w-full h-full object-cover" 
                          loading="lazy"
                          decoding="async"
                          width="400"
                          height="280"
                        />
                      </div>
                      <div className="absolute bottom-0 right-[15%] w-[42%] h-[35%] rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 ring-1 ring-white/50">
                        <img 
                          src={creatorSnowPhotography} 
                          alt="Content creators filming winter travel photography" 
                          className="w-full h-full object-cover" 
                          loading="lazy"
                          decoding="async"
                          width="420"
                          height="350"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Mr & Mrs Smith Style Sections */}
            <WinterSunHero />
            <ThreeGridGallery />
            <HotelScrollSection 
              title={t('home.hotelSections.europeTitle')}
              hotels={europeHotels}
            />
            <HotelScrollSection 
              title={t('home.hotelSections.usTitle')}
              hotels={usHotels}
            />
            
            {/* Fine Dining Around the World - Global Restaurant Discovery */}
            <FineDiningHero />
            
            <RestaurantScrollSection 
              title={t('home.restaurantSections.usTitle')}
              restaurants={topUSRestaurants}
            />
            <PopularSearchGrid />


            {/* Featured Transportation Vendors - Promoted */}
            <section className="px-4 sm:px-6 py-8 sm:py-10 bg-secondary/5">
              <VendorPromotionFeed displayContext="homepage" limit={3} />
            </section>

            {/* From the Journal - Editorial Content */}
            <FromTheJournal />

            {/* Featured Restaurants and Services */}
            <section className="px-4 sm:px-6 pb-10 sm:pb-12 pt-6 sm:pt-8 md:pt-10">
              <div className="w-full max-w-7xl mx-auto">

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
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent font-secondary">
                          {t('home.agentCTA.title')}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {t('home.agentCTA.subtitle')}
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
                          {t('home.agentCTA.apply')}
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={() => navigate('/browse-agents')}
                        >
                          <MapPinned className="h-4 w-4" />
                          {t('home.agentCTA.browse')}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

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
                  <div key={idx} className="space-y-4">
                    <div className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 ${
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

                    {/* Render search results attached to this message */}
                    {msg.searchResults && msg.searchResults.map((result, resultIdx) => (
                      <div key={`msg-${idx}-result-${resultIdx}`} className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
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
                                <CompactHotelCard
                                  key={hotel.hotel_id || hotelIdx}
                                  property={hotel}
                                  searchDates={{
                                    checkIn: result.checkIn || '',
                                    checkOut: result.checkOut || ''
                                  }}
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
                              <PackageCard 
                                packageData={{
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
                                }}
                                userCountry={userCountry}
                                onBook={(pkg) => setPackageBookingData(pkg)}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}

                {/* Price Slider */}
                {showPriceSlider && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
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
                        <span className="text-sm text-muted-foreground">{t('common.searching')}</span>
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t pb-16 sm:pb-0">
              <div className="px-6 py-4 max-w-4xl mx-auto">
                <Card className="border-2 shadow-lg">
                  <div className="p-2">
                    <div className="relative">
                      <Input
                        placeholder={getPlaceholderText()}
                        className="w-full h-11 md:h-12 px-4 pr-20 md:pr-24 text-sm md:text-base border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isLoading}
                      />
                      <Button
                        onClick={handleCalendarClick}
                        size="icon"
                        variant="ghost"
                        className="absolute right-12 md:right-14 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg hover:bg-muted"
                        disabled={isLoading}
                        title="Pick dates from calendar"
                      >
                        <Calendar className="h-4 w-4" />
                      </Button>
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

        {/* Package Booking Modal */}
        {packageBookingData && (
          <BookingModal
            open={!!packageBookingData}
            onClose={() => setPackageBookingData(null)}
            bookingType="hotel"
            bookingData={{
              packageDetails: packageBookingData,
              type: 'package',
              flights: packageBookingData.flights,
              hotels: packageBookingData.hotels,
              cars: packageBookingData.cars,
              origin: packageBookingData.origin,
              destination: packageBookingData.destination,
              departureDate: packageBookingData.departureDate,
              returnDate: packageBookingData.returnDate,
              travelers: packageBookingData.travelers
            }}
            totalPrice={packageBookingData.finalPrice || 0}
            currency={packageBookingData.currencyCode || 'USD'}
          />
        )}

        {/* Date Picker Modal */}
        {showDatePicker && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <ChatDatePicker
              type={showDatePicker.type}
              onDatesSelected={handleDatesSelected}
              onCancel={() => setShowDatePicker(null)}
              suggestedDate={showDatePicker.suggestedDate}
            />
          </div>
        )}

        {/* Welcome Modal */}
        <WelcomeModal 
          open={showWelcomeModal} 
          onClose={() => setShowWelcomeModal(false)}
          isFirstVisit={false}
        />
      </div>
    </main>
  );
};

export default Index;
